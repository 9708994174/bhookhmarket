import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { notificationQueue } from '../jobs/queues';

// ---- Razorpay client ----
const hasRazorpayCredentials = !!config.razorpay.keyId && !!config.razorpay.keySecret;
const razorpay = hasRazorpayCredentials
  ? new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    })
  : null;

// ---- Commission calculation ----
async function getCommissionSettings() {
  const settings = await prisma.commissionSettings.findFirst({
    where: { isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  });
  return {
    platformFeeFixed: settings?.platformFeeFixed ?? config.commission.defaultFeeFixed,
    commissionPercent: settings?.commissionPercent ?? config.commission.defaultCommissionPercent,
    taxPercent: settings?.taxPercent ?? 0,
  };
}

// ---- Create payment order ----
export async function createPaymentOrder(orderId: string, userId: string) {
  if (!hasRazorpayCredentials || !razorpay) {
    throw new AppError(
      'Razorpay credentials are not configured on the backend. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before enabling live payments.',
      500
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { bag: true },
  });

  if (!order) throw new AppError('Order not found', 404);
  if (order.orderStatus !== 'PENDING_PAYMENT') {
    throw new AppError('Order is not in a payable state', 400);
  }

  const amountInPaise = Math.round(order.total * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: orderId,
    notes: {
      orderId,
      userId,
      bagId: order.bagId,
    },
  });

  await prisma.payment.upsert({
    where: { orderId },
    create: {
      orderId,
      provider: 'RAZORPAY',
      providerOrderId: razorpayOrder.id,
      amount: order.total,
      currency: 'INR',
      status: 'PENDING',
    },
    update: {
      providerOrderId: razorpayOrder.id,
      status: 'PENDING',
    },
  });

  return {
    orderId: order.id,
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    keyId: config.razorpay.keyId,
  };
}

// ---- Verify payment (ALWAYS server-side) ----
export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  orderId: string
) {
  if (!hasRazorpayCredentials || !razorpay) {
    throw new AppError(
      'Live payment verification is unavailable because Razorpay is not configured on the backend.',
      500
    );
  }

  // Find payment record
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new AppError('Payment record not found', 404);

  // Verify Razorpay signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    await prisma.payment.update({
      where: { orderId },
      data: { status: 'FAILED', failureReason: 'Invalid signature' },
    });
    throw new AppError('Payment verification failed: Invalid signature', 400);
  }

  // Fetch payment details from Razorpay
  const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
  if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
    throw new AppError('Payment not captured', 400);
  }

  return await confirmPayment(
    orderId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    rzpPayment.method as string
  );
}

async function confirmPayment(
  orderId: string,
  paymentId: string,
  razorpayOrderId: string,
  signature: string,
  method: string
) {
  // Use transaction to atomically confirm order
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { bag: true },
    });

    if (!order) throw new AppError('Order not found', 404);
    if (order.orderStatus !== 'PENDING_PAYMENT') {
      // Already processed (idempotency)
      return order;
    }

    // Generate pickup code
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Update payment
    await tx.payment.update({
      where: { orderId },
      data: {
        providerPaymentId: paymentId,
        providerOrderId: razorpayOrderId,
        providerSignature: signature,
        status: 'SUCCESS',
        method,
        webhookVerified: true,
      },
    });

    // Update order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'SUCCESS',
        orderStatus: 'READY_FOR_PICKUP',
        pickupCode,
      },
    });

    // Record status history
    await tx.orderStatusHistory.create({
      data: { orderId, status: 'READY_FOR_PICKUP', note: 'Payment verified' },
    });

    // Reduce bag inventory (already reserved)
    const updatedBag = await tx.bag.update({
      where: { id: order.bagId },
      data: { remainingQuantity: { decrement: order.quantity } },
    });

    // Update bag status
    if (updatedBag.remainingQuantity <= 0) {
      await tx.bag.update({
        where: { id: order.bagId },
        data: { status: 'SOLD_OUT' },
      });
    } else if (updatedBag.remainingQuantity <= 2) {
      await tx.bag.update({
        where: { id: order.bagId },
        data: { status: 'LOW_STOCK' },
      });
    }

    // Create payout record
    const commission = await getCommissionSettings();
    const commissionAmount =
      (order.subtotal * commission.commissionPercent) / 100 + order.platformFee;
    const netAmount = order.subtotal - commissionAmount;

    await tx.payout.create({
      data: {
        partnerId: order.partnerId,
        orderId,
        grossAmount: order.total,
        commission: commissionAmount,
        commissionPct: commission.commissionPercent,
        netAmount: Math.max(0, netAmount),
        status: 'PENDING',
      },
    });

    return updatedOrder;
  });

  // Queue notifications
  await notificationQueue.add('order-confirmed', {
    orderId,
    userId: result.userId,
    partnerId: result.partnerId,
  });

  return result;
}

// ---- Webhook handler ----
export async function handleWebhook(rawBody: Buffer, signature: string) {
  const webhookSecret = config.razorpay.webhookSecret;
  if (!webhookSecret) return;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new AppError('Invalid webhook signature', 400);
  }

  const event = JSON.parse(rawBody.toString());
  logger.info('Razorpay webhook:', { event: event.event });

  if (event.event === 'payment.failed') {
    const paymentEntity = event.payload?.payment?.entity;
    const receipt = event.payload?.order?.entity?.receipt;
    if (receipt) {
      await handlePaymentFailure(receipt, paymentEntity?.error_description);
    }
  }
}

async function handlePaymentFailure(orderId: string, reason?: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.orderStatus !== 'PENDING_PAYMENT') return;

    // Release reserved inventory
    await tx.bag.update({
      where: { id: order.bagId },
      data: { remainingQuantity: { increment: order.quantity } },
    });

    // Update order
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
        cancelReason: reason ?? 'Payment failed',
      },
    });

    await tx.payment.update({
      where: { orderId },
      data: { status: 'FAILED', failureReason: reason },
    });

    await tx.orderStatusHistory.create({
      data: { orderId, status: 'PAYMENT_FAILED', note: reason ?? 'Payment failed' },
    });
  });
}

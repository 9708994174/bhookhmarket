import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { notificationQueue } from '../jobs/queues';

// ---- Valid state transitions ----
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'CANCELLED', 'EXPIRED'],
  PAYMENT_FAILED: ['CANCELLED'],
  PAID: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'EXPIRED'],
  PICKED_UP: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
  EXPIRED: [],
};

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---- Create order (with inventory reservation) ----
export async function createOrder(userId: string, bagId: string, quantity: number) {
  return await prisma.$transaction(async (tx) => {
    // Lock the bag row to prevent race conditions
    const bag = await tx.$queryRaw<any[]>`
      SELECT * FROM bags WHERE id = ${bagId} FOR UPDATE
    `;
    const bagData = bag[0];

    if (!bagData) throw new AppError('Bag not found', 404);
    if (bagData.status !== 'ACTIVE' && bagData.status !== 'LOW_STOCK') {
      throw new AppError('Bag is not available', 400);
    }
    if (bagData.remaining_quantity < quantity) {
      throw new AppError(
        bagData.remaining_quantity === 0
          ? 'This bag is sold out'
          : `Only ${bagData.remaining_quantity} bags remaining`,
        400
      );
    }

    const now = new Date();
    if (new Date(bagData.pickup_end) < now) {
      throw new AppError('Pickup window has expired', 400);
    }

    // Get partner
    const partner = await tx.partner.findUnique({
      where: { id: bagData.partner_id },
      select: { id: true, verificationStatus: true, isActive: true },
    });
    if (!partner?.isActive || partner.verificationStatus !== 'APPROVED') {
      throw new AppError('Partner is not active', 400);
    }

    // Get commission settings
    const commission = await tx.commissionSettings.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    const platformFee = commission?.platformFeeFixed ?? 15;
    const taxPercent = commission?.taxPercent ?? 0;

    const subtotal = bagData.selling_price * quantity;
    const tax = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
    const total = subtotal + platformFee + tax;

    // Reserve inventory (decrement before payment)
    await tx.$executeRaw`
      UPDATE bags SET remaining_quantity = remaining_quantity - ${quantity} WHERE id = ${bagId}
    `;

    // Update status if needed
    const newRemaining = bagData.remaining_quantity - quantity;
    if (newRemaining <= 0) {
      await tx.bag.update({ where: { id: bagId }, data: { status: 'SOLD_OUT' } });
    } else if (newRemaining <= 2) {
      await tx.bag.update({ where: { id: bagId }, data: { status: 'LOW_STOCK' } });
    }

    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        partnerId: bagData.partner_id,
        bagId,
        quantity,
        subtotal,
        platformFee,
        tax,
        total,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_PAYMENT',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min to pay
      },
    });

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: 'PENDING_PAYMENT', note: 'Order created' },
    });

    return order;
  });
}

// ---- Get orders for consumer ----
export async function getUserOrders(userId: string, status?: string) {
  const where: any = { userId };

  if (status === 'upcoming') {
    where.orderStatus = { in: ['PENDING_PAYMENT', 'PAID', 'READY_FOR_PICKUP'] };
  } else if (status === 'completed') {
    where.orderStatus = { in: ['COMPLETED', 'PICKED_UP'] };
  } else if (status === 'cancelled') {
    where.orderStatus = { in: ['CANCELLED', 'REFUNDED', 'PAYMENT_FAILED', 'EXPIRED'] };
  }

  return prisma.order.findMany({
    where,
    include: {
      bag: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          pickupStart: true,
          pickupEnd: true,
          originalValue: true,
          sellingPrice: true,
        },
      },
      partner: {
        select: {
          id: true,
          businessName: true,
          address: true,
          latitude: true,
          longitude: true,
          logoImage: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// ---- Get order by ID ----
export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      bag: true,
      partner: true,
      payment: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) throw new AppError('Order not found', 404);
  return order;
}

// ---- Cancel order ----
export async function cancelOrder(orderId: string, userId: string, reason: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new AppError('Order not found', 404);

  if (!canTransition(order.orderStatus, 'CANCELLED')) {
    throw new AppError(`Cannot cancel order in ${order.orderStatus} status`, 400);
  }

  await prisma.$transaction(async (tx) => {
    // Release inventory if payment was pending
    if (order.orderStatus === 'PENDING_PAYMENT') {
      await tx.bag.update({
        where: { id: order.bagId },
        data: { remainingQuantity: { increment: order.quantity } },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'CANCELLED',
        cancelReason: reason,
      },
    });

    await tx.orderStatusHistory.create({
      data: { orderId, status: 'CANCELLED', note: reason },
    });
  });

  return { message: 'Order cancelled successfully' };
}

// ---- Partner: verify pickup QR ----
export async function verifyPickup(pickupCode: string, partnerId: string) {
  const order = await prisma.order.findFirst({
    where: {
      pickupCode,
      partnerId,
      orderStatus: 'READY_FOR_PICKUP',
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      bag: { select: { id: true, title: true } },
    },
  });

  if (!order) {
    // Check if already picked up
    const existing = await prisma.order.findFirst({ where: { pickupCode, partnerId } });
    if (existing?.orderStatus === 'PICKED_UP' || existing?.orderStatus === 'COMPLETED') {
      throw new AppError('This bag has already been collected', 400);
    }
    throw new AppError('Invalid pickup code or order not ready', 400);
  }

  // Verify pickup window
  const bag = await prisma.bag.findUnique({ where: { id: order.bagId } });
  const now = new Date();
  if (bag && now < new Date(bag.pickupStart)) {
    throw new AppError('Pickup window has not started yet', 400);
  }

  // Mark picked up
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        orderStatus: 'PICKED_UP',
        pickedUpAt: new Date(),
      },
    });

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: 'PICKED_UP', note: 'QR code verified by partner' },
    });

    // Update impact stats
    await tx.impactStats.update({
      where: { userId: order.userId },
      data: {
        totalBagsRescued: { increment: order.quantity },
        totalMoneySaved: { increment: order.subtotal - (bag?.originalValue ?? order.subtotal) },
      },
    });
  });

  // Queue completion notification
  await notificationQueue.add('pickup-confirmed', {
    orderId: order.id,
    userId: order.userId,
    partnerId,
  });

  return {
    message: 'Pickup confirmed successfully',
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      customer: order.user,
      bag: order.bag,
    },
  };
}

// ---- Partner: get orders ----
export async function getPartnerOrders(partnerId: string, tab: string) {
  const where: any = { partnerId };

  if (tab === 'upcoming') {
    where.orderStatus = { in: ['PAID', 'READY_FOR_PICKUP'] };
  } else if (tab === 'pickedup') {
    where.orderStatus = { in: ['PICKED_UP', 'COMPLETED'] };
  } else if (tab === 'cancelled') {
    where.orderStatus = { in: ['CANCELLED', 'REFUNDED'] };
  }

  return prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, phone: true } },
      bag: { select: { id: true, title: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

import { Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../services/notification.service';

export async function startWorkers() {
  // ---- Notification Worker ----
  const notificationWorker = new Worker(
    'notifications',
    async (job) => {
      const { name, data } = job;
      logger.info(`Processing notification job: ${name}`);

      switch (name) {
        case 'order-confirmed': {
          const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: {
              user: true,
              bag: true,
              partner: true,
            },
          });
          if (!order) break;

          // Consumer notification
          await prisma.notification.create({
            data: {
              userId: order.userId,
              title: 'Order Confirmed',
              message: `Your Surprise Bag from ${order.partner.businessName} is confirmed. Pickup: ${formatPickupTime(order.bag.pickupStart, order.bag.pickupEnd)}`,
              type: 'ORDER_CONFIRMED',
              data: { orderId: order.id },
            },
          });

          if (order.user.fcmToken) {
            await sendPushNotification(order.user.fcmToken, {
              title: 'Order Confirmed',
              body: `Your Surprise Bag is ready. Pickup from ${order.partner.businessName}.`,
              data: { type: 'ORDER_CONFIRMED', orderId: order.id },
            });
          }

          // Partner notification
          await prisma.partnerNotification.create({
            data: {
              partnerId: order.partnerId,
              title: 'New Order',
              message: `New order for ${order.bag.title}. Customer: ${order.user.name ?? order.user.phone}`,
              type: 'NEW_ORDER',
            },
          });
          break;
        }

        case 'pickup-confirmed': {
          const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: { user: true, partner: true },
          });
          if (!order) break;

          await prisma.notification.create({
            data: {
              userId: order.userId,
              title: 'Pickup Complete',
              message: `You have successfully collected your Surprise Bag from ${order.partner.businessName}. Share your experience!`,
              type: 'ORDER_CONFIRMED',
              data: { orderId: order.id },
            },
          });

          if (order.user.fcmToken) {
            await sendPushNotification(order.user.fcmToken, {
              title: 'Pickup Complete',
              body: `Bag collected from ${order.partner.businessName}. Rate your experience!`,
              data: { type: 'PICKUP_COMPLETE', orderId: order.id },
            });
          }
          break;
        }

        case 'favorite-bag-available': {
          const bag = await prisma.bag.findUnique({
            where: { id: data.bagId },
            include: { partner: true },
          });
          const user = await prisma.user.findUnique({ where: { id: data.userId } });
          if (!bag || !user) break;

          await prisma.notification.create({
            data: {
              userId: data.userId,
              title: 'New Surprise Bag Available',
              message: `${bag.partner.businessName} just posted a new Surprise Bag worth Rs ${bag.originalValue} for Rs ${bag.sellingPrice}.`,
              type: 'FAVORITE_BAG_AVAILABLE',
              data: { bagId: bag.id, partnerId: bag.partnerId },
            },
          });

          if (user.fcmToken) {
            await sendPushNotification(user.fcmToken, {
              title: `${bag.partner.businessName} has a new bag`,
              body: `Grab it for Rs ${bag.sellingPrice} before it sells out!`,
              data: { type: 'BAG_AVAILABLE', bagId: bag.id },
            });
          }
          break;
        }

        case 'pickup-reminder': {
          const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: { user: true, partner: true, bag: true },
          });
          if (!order || order.orderStatus !== 'READY_FOR_PICKUP') break;

          await prisma.notification.create({
            data: {
              userId: order.userId,
              title: 'Pickup Reminder',
              message: `Your Surprise Bag pickup starts in 30 minutes at ${order.partner.businessName}.`,
              type: 'PICKUP_REMINDER',
              data: { orderId: order.id },
            },
          });

          if (order.user.fcmToken) {
            await sendPushNotification(order.user.fcmToken, {
              title: 'Pickup Starting Soon',
              body: `Head to ${order.partner.businessName} for your Surprise Bag.`,
              data: { type: 'PICKUP_REMINDER', orderId: order.id },
            });
          }
          break;
        }
      }
    },
    { connection: redis, concurrency: 5 }
  );

  notificationWorker.on('failed', (job, err) => {
    logger.error(`Notification job failed: ${job?.name}`, err);
  });

  // ---- Order Expiry Worker ----
  const orderExpiryWorker = new Worker(
    'order-expiry',
    async (job) => {
      const { orderId } = job.data;
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.orderStatus !== 'PENDING_PAYMENT') return;

      await prisma.$transaction(async (tx) => {
        await tx.bag.update({
          where: { id: order.bagId },
          data: { remainingQuantity: { increment: order.quantity } },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { orderStatus: 'EXPIRED', cancelReason: 'Payment timeout' },
        });
      });

      logger.info(`Order ${orderId} expired due to payment timeout`);
    },
    { connection: redis }
  );

  orderExpiryWorker.on('failed', (job, err) => {
    logger.error(`Order expiry job failed: ${job?.name}`, err);
  });

  logger.info('All workers started');
}

function formatPickupTime(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${fmt(start)} - ${fmt(end)}`;
}

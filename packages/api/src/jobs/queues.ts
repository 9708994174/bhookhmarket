import { Queue } from 'bullmq';
import { redis } from '../lib/redis';

const connection = redis;

export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export const orderExpiryQueue = new Queue('order-expiry', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 10,
  },
});

export const bagExpiryQueue = new Queue('bag-expiry', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 10,
  },
});

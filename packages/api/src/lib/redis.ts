import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 2) return null;
    return 1000;
  },
});

let isConnected = false;

redis.on('error', (err) => {
  isConnected = false;
  logger.warn(`Redis error: ${err.message}`);
});

redis.on('connect', () => {
  isConnected = true;
  logger.info('Connected to Redis');
});

export async function initRedis(): Promise<boolean> {
  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }
    await redis.ping();
    isConnected = true;
    return true;
  } catch (err: any) {
    isConnected = false;
    logger.warn(`Redis unavailable (${err?.message || 'connection failed'}). Running in fallback mode.`);
    return false;
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isConnected) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!isConnected) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
}

export async function deleteCache(key: string): Promise<void> {
  if (!isConnected) return;
  try {
    await redis.del(key);
  } catch {}
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!isConnected) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {}
}

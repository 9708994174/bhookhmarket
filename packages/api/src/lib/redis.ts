import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 1) return null;
    return 1000;
  },
});

redis.on('error', () => {
  // Silent in dev when redis is not running
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {}
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {}
}

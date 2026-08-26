import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Use a placeholder URL if REDIS_URL is not set — initRedis() returns false early in this case
const REDIS_URL = config.redis.url || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 5000,
  commandTimeout: 3000,
  retryStrategy(times) {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 500, 2000);
  },
});

let isConnected = false;

redis.on('error', (err) => {
  if (isConnected) {
    // Only log state change, not every repeated error
    logger.warn(`[Redis] Connection lost: ${err.message}. Rate limiting disabled until reconnected.`);
  }
  isConnected = false;
});

redis.on('connect', () => {
  isConnected = true;
  logger.info('[Redis] Connected successfully.');
});

redis.on('reconnecting', () => {
  logger.info('[Redis] Reconnecting...');
});

export async function initRedis(): Promise<boolean> {
  // No Redis URL configured — skip entirely (rate limiting will be disabled)
  if (!config.redis.url) {
    logger.warn('[Redis] REDIS_URL not set. Running without Redis. Rate limiting is disabled.');
    return false;
  }
  try {
    if (redis.status === 'wait' || redis.status === 'close') {
      await redis.connect();
    }
    await redis.ping();
    isConnected = true;
    logger.info('[Redis] Ping successful.');
    return true;
  } catch (err: any) {
    isConnected = false;
    logger.warn(
      `[Redis] Unavailable (${err?.message ?? 'connection failed'}). ` +
      `Running without distributed rate limiting. Set REDIS_URL in Render dashboard to enable.`
    );
    return false;
  }
}

export function isRedisConnected(): boolean {
  return isConnected;
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

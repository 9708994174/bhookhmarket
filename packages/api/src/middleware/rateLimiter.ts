import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit?.windowMs ?? 15 * 60 * 1000,
  max: config.rateLimit?.max ?? 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
  skip: (req) => req.ip === '127.0.0.1' && config.nodeEnv === 'development',
});

// Stricter limiter for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

// OTP-specific limiter
export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator: (req) => req.body?.phone ?? req.ip ?? 'unknown',
  message: { success: false, error: 'Please wait before requesting another OTP.' },
});

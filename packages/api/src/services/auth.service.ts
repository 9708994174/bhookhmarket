import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../utils/logger';
import axios from 'axios';
import { AppError } from '../middleware/errorHandler';
import { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } from '@bhookhmarket/shared';

// ---- JWT ----

export function generateTokens(userId: string, role: string, phone: string) {
  const accessToken = jwt.sign(
    { userId, role, phone },
    config.jwt.secret,
    { expiresIn: (config.jwt.expiresIn as any) }
  );
  const refreshToken = jwt.sign(
    { userId, role, phone },
    config.jwt.refreshSecret,
    { expiresIn: (config.jwt.refreshExpiresIn as any) }
  );
  return { accessToken, refreshToken };
}

export async function saveRefreshToken(userId: string, token: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
}

// ---- OTP ----

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check Redis-based rate limit. Returns true if allowed, false if rate-limited.
 * NEVER throws — Redis being down means no rate limiting (graceful degradation).
 */
async function checkAndSetRateLimit(phone: string): Promise<boolean> {
  const ratioKey = `otp:rate:${phone}`;
  try {
    const existing = await redis.get(ratioKey);
    if (existing) return false; // rate limited
    await redis.setex(ratioKey, 60, '1');
    return true;
  } catch (err: any) {
    // Redis unavailable — allow OTP but log the issue
    logger.warn(`[OTP Rate Limit] Redis unavailable (${err?.message}). Skipping rate limit for +91${phone}.`);
    return true; // allow through
  }
}

export async function sendOtp(phone: string): Promise<{ message: string }> {
  // Rate limit via Redis (non-blocking — degrades gracefully if Redis is down)
  const allowed = await checkAndSetRateLimit(phone);
  if (!allowed) {
    throw new AppError('Please wait before requesting another OTP.', 429);
  }

  // Use a fixed OTP for the owner/dev test number
  const otp = phone === '9708994174' ? '777777' : generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Soft-invalidate any previous pending sessions for this phone
  await prisma.otpSession.updateMany({
    where: { phone, verified: false },
    data: { verified: true },
  });

  // Persist new session with hashed OTP
  const hashedOtp = await bcrypt.hash(otp, 10);
  await prisma.otpSession.create({
    data: { phone, otp: hashedOtp, expiresAt },
  });

  // Dispatch SMS (or log OTP to console if no SMS provider is configured)
  await dispatchSmsOtp(phone, otp);
  return { message: 'OTP sent successfully' };
}

/**
 * Dispatch OTP via the configured SMS provider.
 * Provider priority (auto mode): Fast2SMS → MSG91 → Twilio → console log
 * Each provider fails gracefully and falls through to the next.
 */
async function dispatchSmsOtp(phone: string, otp: string): Promise<void> {
  const provider = config.otp.provider;

  // 1. Mock provider — just log (for local development)
  if (provider === 'mock') {
    logger.info(
      `\n${'='.repeat(60)}\n  [BHOOKHMARKET MOCK OTP]\n  Phone : +91${phone}\n  Code  : ${otp}\n  Valid : ${OTP_EXPIRY_MINUTES} minutes\n${'='.repeat(60)}`
    );
    return;
  }

  // 2. Demo / always-pass numbers — skip SMS dispatch
  const demoNumbers = ['9999999999', '8888888888'];
  if (demoNumbers.includes(phone)) {
    logger.info(`[Demo] Skipping SMS for demo number +91${phone} | OTP: ${otp}`);
    return;
  }

  // 3. Fast2SMS — free Indian gateway (recommended for dev + production)
  if (provider === 'fast2sms' || (provider === 'auto' && config.otp.fast2smsApiKey)) {
    try {
      const res = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'otp',
          variables_values: otp,
          numbers: phone,
          flash: '0',
        },
        {
          headers: {
            authorization: config.otp.fast2smsApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      if (res.data?.return === true) {
        logger.info(`[Fast2SMS] OTP dispatched to +91${phone}`);
        return;
      }
      logger.warn('[Fast2SMS] Unexpected response:', res.data);
    } catch (err: any) {
      const detail = err?.response?.data ?? err?.message;
      logger.warn('[Fast2SMS] Send failed:', detail);
      if (provider === 'fast2sms') {
        throw new AppError('Failed to send SMS via Fast2SMS. Please try again.', 503);
      }
      // auto mode — fall through to next provider
    }
  }

  // 4. MSG91 — production Indian SMS gateway
  if (provider === 'msg91' || (provider === 'auto' && config.otp.msg91AuthKey && config.otp.msg91TemplateId)) {
    try {
      const res = await axios.post(
        'https://control.msg91.com/api/v5/otp',
        {
          template_id: config.otp.msg91TemplateId,
          mobile: `91${phone}`,
          authkey: config.otp.msg91AuthKey,
          otp,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      if (res.data?.type === 'success' || res.status === 200) {
        logger.info(`[MSG91] OTP dispatched to +91${phone}`);
        return;
      }
      logger.warn('[MSG91] Unexpected response:', res.data);
    } catch (err: any) {
      const detail = err?.response?.data ?? err?.message;
      logger.warn('[MSG91] Send failed:', detail);
      if (provider === 'msg91') {
        throw new AppError('Failed to send OTP via MSG91. Check MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.', 503);
      }
      // auto mode — fall through
    }
  }

  // 5. 2Factor — Indian SMS gateway
  if (provider === '2factor' || (provider === 'auto' && config.otp.twoFactorApiKey)) {
    try {
      const res = await axios.get(
        `https://2factor.in/v3/${config.otp.twoFactorApiKey}/SMS/91${phone}/${otp}/BhookhMarket`,
        { timeout: 10000 }
      );
      if (res.data?.Status === 'Success') {
        logger.info(`[2Factor] OTP dispatched to +91${phone}`);
        return;
      }
    } catch (err: any) {
      logger.warn('[2Factor] Send failed:', err?.response?.data ?? err?.message);
      if (provider === '2factor') {
        throw new AppError('Failed to send SMS via 2Factor.', 503);
      }
    }
  }

  // 6. Twilio SMS
  if (
    provider === 'twilio' ||
    (provider === 'auto' && config.otp.twilioAccountSid && config.otp.twilioAuthToken && config.otp.twilioFromNumber)
  ) {
    try {
      const authHeader = Buffer.from(
        `${config.otp.twilioAccountSid}:${config.otp.twilioAuthToken}`
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('To', `+91${phone}`);
      params.append('From', config.otp.twilioFromNumber);
      params.append(
        'Body',
        `Your BhookhMarket verification code is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this OTP.`
      );

      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${config.otp.twilioAccountSid}/Messages.json`,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );
      logger.info(`[Twilio] OTP dispatched to +91${phone}`);
      return;
    } catch (err: any) {
      logger.warn('[Twilio] Send failed:', err?.response?.data ?? err?.message);
      if (provider === 'twilio') {
        throw new AppError('Failed to send SMS via Twilio.', 503);
      }
    }
  }

  // 7. Last resort — log OTP to console (visible in Render/server logs)
  // In production this is NOT shown to users; only visible to admins in server logs.
  // Remove or gate behind OTP_DEV_MODE=true for a fully live deployment.
  if (config.otp.devMode || config.nodeEnv !== 'production') {
    logger.info(
      `\n${'='.repeat(60)}\n  [BHOOKHMARKET OTP — CHECK SERVER LOGS]\n  Phone : +91${phone}\n  Code  : ${otp}\n  Valid : ${OTP_EXPIRY_MINUTES} minutes\n${'='.repeat(60)}`
    );
    return;
  }

  // Production with no provider configured — fail clearly
  logger.error(
    `[OTP] No SMS provider is configured for production! ` +
    `Set OTP_PROVIDER env var to one of: fast2sms, msg91, twilio, 2factor, mock. ` +
    `Also set the corresponding API key env var.`
  );
  throw new AppError(
    'OTP service is not configured. Please contact support.',
    503
  );
}

export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ userId: string; isNewUser: boolean; accessToken: string; refreshToken: string }> {
  // Always-pass test accounts (owner + demo numbers)
  const isCustomTestOtp =
    (phone === '9708994174' && (otp === '777777' || otp === '123456')) ||
    (['9999999999', '8888888888'].includes(phone) && (otp === '123456' || otp === '777777'));

  const session = await prisma.otpSession.findFirst({
    where: {
      phone,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!isCustomTestOtp && !session) {
    throw new AppError('OTP expired or not found. Please request a new one.', 400);
  }

  if (session) {
    // Increment attempts first
    await prisma.otpSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    });

    if (session.attempts >= OTP_MAX_ATTEMPTS && !isCustomTestOtp) {
      throw new AppError('Too many incorrect attempts. Please request a new OTP.', 400);
    }
  }

  const isValid = isCustomTestOtp || (session ? await bcrypt.compare(otp, session.otp) : false);
  if (!isValid) {
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  // Mark session verified
  if (session) {
    await prisma.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    });
  }

  // Upsert user
  let isNewUser = false;
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    isNewUser = true;
    user = await prisma.user.create({
      data: { phone, role: 'CONSUMER', isVerified: true },
    });
    // Initialize impact stats for new user
    await prisma.impactStats.create({ data: { userId: user.id } });
  }

  const tokens = generateTokens(user.id, user.role, user.phone);
  await saveRefreshToken(user.id, tokens.refreshToken);

  return { userId: user.id, isNewUser, ...tokens };
}

// ---- Google OAuth ----

export async function googleAuth(idToken: string) {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(config.google.clientId);

  const ticket = await client.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError('Invalid Google token', 400);
  }

  let isNewUser = false;
  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    isNewUser = true;
    const tempPhone = `GOOGLE_${crypto.randomBytes(8).toString('hex')}`;
    user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        phone: tempPhone,
        profileImage: payload.picture,
        role: 'CONSUMER',
        isVerified: true,
      },
    });
    await prisma.impactStats.create({ data: { userId: user.id } });
  }

  const tokens = generateTokens(user.id, user.role, user.phone);
  await saveRefreshToken(user.id, tokens.refreshToken);

  return { userId: user.id, isNewUser, ...tokens };
}

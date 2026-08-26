import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const val = process.env[key];
  if (!val) {
    if (fallback !== undefined) return fallback;
    if (process.env.NODE_ENV === 'production') {
      // Warn but don't crash — missing optional vars shouldn't kill the server
      console.warn(`[CONFIG] Warning: Missing env var "${key}". Some features may be disabled.`);
      return '';
    }
    return '';
  }
  return val;
}

function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Allow any mobile/Expo client origin in production (mobile apps don't send Origin header)
const configuredOrigins = process.env.CORS_ORIGINS ?? process.env.ALLOWED_ORIGINS;

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  isDev: process.env.NODE_ENV !== 'production',

  allowedOrigins: parseOrigins(
    configuredOrigins ??
    'http://localhost:3000,http://localhost:8081,exp://localhost:8081'
  ),

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  },

  commission: {
    defaultFeeFixed: 5,
    defaultCommissionPercent: 30,
    taxPercent: 0,
  },

  database: {
    url: requireEnv(
      'DATABASE_URL',
      'postgresql://bhookhmarket:password@localhost:5432/bhookhmarket?schema=public'
    ),
  },

  redis: {
    // Default to a dummy URL that will fail gracefully (no localhost Redis on Render)
    url: process.env.REDIS_URL ?? '',
  },

  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-secret-change-in-production-256bit'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production-256bit'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    refreshExpiresInDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? '30', 10),
  },

  otp: {
    /**
     * Provider priority (auto mode):
     *   fast2sms → msg91 → 2factor → twilio → console log
     * Set OTP_PROVIDER to a specific provider name to skip auto-detection.
     * Set OTP_PROVIDER=mock for local development (no real SMS sent).
     */
    provider: (process.env.OTP_PROVIDER ?? 'auto') as
      | 'auto'
      | 'fast2sms'
      | 'msg91'
      | '2factor'
      | 'twilio'
      | 'mock',

    /**
     * When true, the OTP code is always logged to the console regardless of provider.
     * Useful for development/testing. Never set to true in production for real users.
     */
    devMode: process.env.OTP_DEV_MODE === 'true',

    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? '10', 10),

    // Fast2SMS (free Indian SMS — recommended for India-first apps)
    fast2smsApiKey: process.env.FAST2SMS_API_KEY ?? '',

    // 2Factor (Indian SMS gateway)
    twoFactorApiKey: process.env.TWOFACTOR_API_KEY ?? '',

    // Twilio (global SMS)
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    twilioFromNumber: process.env.TWILIO_PHONE_NUMBER ?? '',

    // MSG91 (Indian SMS gateway)
    msg91AuthKey: process.env.MSG91_AUTH_KEY ?? '',
    msg91SenderId: process.env.MSG91_SENDER_ID ?? 'BHOOKHM',
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID ?? '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },

  // Firebase Admin SDK — used for push notifications (FCM) only
  // NOT used for OTP SMS dispatch
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    apiKey: process.env.FIREBASE_API_KEY ?? '', // kept for reference only
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  cors: {
    origins: parseOrigins(
      configuredOrigins ??
      'http://localhost:3000,http://localhost:8081,exp://localhost:8081'
    ),
  },
};

// ---- Production config validation ----
if (config.nodeEnv === 'production') {
  const missing: string[] = [];

  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');

  if (missing.length > 0) {
    console.error(`[CONFIG] CRITICAL: Missing required production env vars: ${missing.join(', ')}`);
    // Don't crash — let the first DB query fail with a clear error
  }

  // Warn if Redis is not configured (rate limiting will be disabled)
  if (!process.env.REDIS_URL) {
    console.warn(
      '[CONFIG] REDIS_URL not set. OTP rate limiting is disabled. ' +
      'Add a free Upstash Redis URL in the Render dashboard to enable it.'
    );
  }

  // Warn if no SMS provider is configured
  const hasOtpProvider =
    config.otp.fast2smsApiKey ||
    (config.otp.msg91AuthKey && config.otp.msg91TemplateId) ||
    config.otp.twoFactorApiKey ||
    (config.otp.twilioAccountSid && config.otp.twilioAuthToken);

  if (!hasOtpProvider && config.otp.provider !== 'mock') {
    console.warn(
      '[CONFIG] No SMS provider credentials found. OTP codes will only appear in server logs. ' +
      'Set FAST2SMS_API_KEY (recommended) or MSG91_AUTH_KEY + MSG91_TEMPLATE_ID in Render dashboard.'
    );
  }

  if (config.otp.devMode) {
    console.warn('[CONFIG] OTP_DEV_MODE=true in production. OTP codes will be visible in logs.');
  }
}

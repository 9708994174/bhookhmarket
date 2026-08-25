import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const val = process.env[key];
  if (!val && fallback === undefined) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return '';
  }
  return val ?? fallback ?? '';
}

function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const configuredOrigins = process.env.CORS_ORIGINS ?? process.env.ALLOWED_ORIGINS;

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  isDev: process.env.NODE_ENV !== 'production',

  allowedOrigins: parseOrigins(configuredOrigins ?? 'http://localhost:3000,http://localhost:8081'),

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
    url: requireEnv('DATABASE_URL', 'postgresql://bhookhmarket:password@localhost:5432/bhookhmarket?schema=public'),
  },

  redis: {
    url: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-secret-change-in-production-256bit'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production-256bit'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    refreshExpiresInDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? '30', 10),
  },

  otp: {
    provider: (process.env.OTP_PROVIDER ?? 'auto') as 'auto' | 'firebase' | 'fast2sms' | '2factor' | 'twilio' | 'msg91' | 'mock',
    devMode: process.env.OTP_DEV_MODE === 'true',
    otpExpiryMinutes: 10,

    // Firebase Phone Auth (10,000 free verifications/month)
    firebaseApiKey: process.env.FIREBASE_API_KEY ?? '',

    // Fast2SMS (Free trial credits in India)
    fast2smsApiKey: process.env.FAST2SMS_API_KEY ?? '',

    // 2Factor (Free trial credits in India)
    twoFactorApiKey: process.env.TWOFACTOR_API_KEY ?? '',

    // Twilio
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    twilioFromNumber: process.env.TWILIO_PHONE_NUMBER ?? '',

    // MSG91
    msg91AuthKey: process.env.MSG91_AUTH_KEY ?? '',
    msg91SenderId: process.env.MSG91_SENDER_ID ?? 'BHMRKT',
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

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  cors: {
    origins: parseOrigins(configuredOrigins ?? 'http://localhost:3000,http://localhost:8081'),
  },
};

if (config.nodeEnv === 'production') {
  const requiredProductionVariables = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];
  const missing = requiredProductionVariables.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[CONFIG WARNING] Missing recommended production environment variables: ${missing.join(', ')}`);
  }
  if (config.otp.devMode) {
    console.warn('[CONFIG WARNING] OTP_DEV_MODE is enabled in production mode.');
  }
  const otpProvider = config.otp.provider;
  const missingOtpProvider =
    otpProvider === 'msg91' && (!config.otp.msg91AuthKey || !config.otp.msg91TemplateId);
  if (otpProvider === 'auto' || missingOtpProvider) {
    console.warn('[CONFIG WARNING] OTP_PROVIDER credentials not fully configured, defaulting to auto/dev verification.');
  }
}

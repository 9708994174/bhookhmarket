import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

// Routes
import authRoutes from './routes/auth';
import bagRoutes from './routes/bags';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import partnerRoutes from './routes/partners';
import reviewRoutes from './routes/reviews';
import favoriteRoutes from './routes/favorites';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';

const app = express();

// ---- Security ----
app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// ---- Performance ----
app.use(compression());

// ---- Logging ----
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ---- Body Parsing ----
// Webhook route needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- Rate Limiting ----
app.use('/api/', rateLimiter);

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbErr: any) {
    return res.status(503).json({
      status: 'not_ready',
      reason: 'database',
      timestamp: new Date().toISOString(),
    });
  }

  let redisOk = false;
  try {
    await redis.ping();
    redisOk = true;
  } catch {
    // Redis unavailable is non-fatal — app still functions
  }

  res.json({ status: 'ready', redis: redisOk, timestamp: new Date().toISOString() });
});

// ---- API Routes (Supporting both /api and /api/v1) ----
const routes = [
  ['/auth', authRoutes],
  ['/bags', bagRoutes],
  ['/orders', orderRoutes],
  ['/payments', paymentRoutes],
  ['/partners', partnerRoutes],
  ['/reviews', reviewRoutes],
  ['/favorites', favoriteRoutes],
  ['/notifications', notificationRoutes],
  ['/admin', adminRoutes],
  ['/upload', uploadRoutes],
] as const;

routes.forEach(([path, router]) => {
  app.use(`/api${path}`, router);
  app.use(`/api/v1${path}`, router);
});

// ---- 404 ----
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ---- Error Handler ----
app.use(errorHandler);

export default app;

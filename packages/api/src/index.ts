import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';
import { redis, initRedis } from './lib/redis';
import { startWorkers } from './jobs/workers';

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');

    // Redis connection & background workers
    try {
      const isRedisReady = await initRedis();
      if (isRedisReady) {
        try {
          await startWorkers();
          logger.info('Background workers started');
        } catch (workerErr: any) {
          logger.warn(`Background workers warning: ${workerErr?.message}`);
        }
      }
    } catch (redisErr: any) {
      logger.warn(`Redis init warning: ${redisErr?.message}`);
    }

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`BhookhMarket API running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`Health check available at http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(async () => {
        try { await prisma.$disconnect(); } catch {}
        try { await redis.quit(); } catch {}
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

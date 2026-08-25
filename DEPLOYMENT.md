# =============================================================================
# BhookhMarket Deployment Guide
# =============================================================================

## Architecture

```
BhookhMarket Monorepo (Turborepo)
├── apps/
│   └── mobile/          ← Expo React Native app
└── packages/
    ├── api/             ← Express.js backend
    ├── database/        ← Prisma + PostgreSQL schema
    └── shared/          ← Shared types, schemas, constants
```

## Phase 1: Render + Vercel (Current)

### Backend → Render

1. Push to GitHub
2. Create a new Render Web Service
3. Set:
    - Build Command: `npm install && npx prisma generate --schema packages/database/prisma/schema.prisma && npm run build --workspace @bhookhmarket/api`
    - Start Command: `node packages/api/dist/index.js` (or `node packages/api/dist/api/src/index.js`)
4. Add a Render Postgres database (or connect Supabase/Neon)
5. Add Redis (Upstash is suitable for the free tier)

This repository currently has no Prisma migration directory. Apply the schema to
the production database with a reviewed migration process before first launch;
do not use `prisma db push` automatically in production.
6. Set all environment variables from `.env.example`

### Mobile → Expo Go / EAS

```bash
# Development
npx expo start --tunnel

# Build APK for testing
npx eas build --platform android --profile preview

# Production build
npx eas build --platform android --profile production
```

## Phase 2: AWS Migration (Later)

### Recommended Stack
- **Compute**: ECS Fargate (auto-scaling containers)
- **Database**: RDS PostgreSQL with PostGIS + Read Replicas
- **Cache**: ElastiCache Redis Cluster
- **CDN**: CloudFront for API + S3 for static assets
- **Queue**: Amazon SQS for reliable job processing
- **Notifications**: Firebase FCM (stays the same)
- **Images**: S3 + Cloudfront (replace Cloudinary)
- **Secrets**: AWS Secrets Manager
- **Monitoring**: CloudWatch + X-Ray

### Migration Path
1. Containerize API using provided `Dockerfile`
2. Push image to ECR
3. Create ECS cluster + task definitions
4. Migrate PostgreSQL to RDS (pg_dump/restore)
5. Update Redis connection to ElastiCache
6. Update environment variables
7. Point domain to CloudFront

## Local Development

```bash
# Start infrastructure
docker-compose up -d

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start API
npm run dev --filter=@bhookhmarket/api

# Start mobile
cd apps/mobile
npx expo start
```

## Environment Setup

Copy `.env.example` to `.env` and fill in values.
OTP delivery uses MSG91 in every environment. Configure the MSG91 credentials before
testing authentication, and configure Razorpay credentials before testing checkout.

The mobile app uses native Razorpay checkout for UPI and therefore requires a custom
development or production build after installing dependencies:

```bash
cd apps/mobile
npx expo prebuild
npx expo run:android --device
```

The API creates Razorpay orders, the mobile app opens the native checkout, and the API
verifies the returned signature before moving an order to `READY_FOR_PICKUP`.

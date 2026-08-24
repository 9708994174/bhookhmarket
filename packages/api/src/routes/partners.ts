import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { PartnerRegistrationSchema } from '@bhookhmarket/shared';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /partners/register
router.post(
  '/register',
  authenticate,
  validate(PartnerRegistrationSchema),
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    // Check if partner profile already exists
    const existing = await prisma.partner.findUnique({ where: { ownerUserId: userId } });
    if (existing) {
      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.partner.update({
          where: { id: existing.id },
          data: {
            ...req.body,
            verificationStatus: 'APPROVED',
            isActive: true,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { role: 'PARTNER' },
        });

        return p;
      });

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Partner profile updated successfully.',
      });
    }

    const slug = generateSlug(req.body.businessName);

    const partner = await prisma.$transaction(async (tx) => {
      const p = await tx.partner.create({
        data: {
          ownerUserId: userId,
          slug: await ensureUniqueSlug(slug, tx),
          ...req.body,
          verificationStatus: 'APPROVED',
          isActive: true,
        },
      });

      // Update user role to PARTNER
      await tx.user.update({
        where: { id: userId },
        data: { role: 'PARTNER' },
      });

      return p;
    });

    res.status(201).json({
      success: true,
      data: partner,
      message: 'Partner registration submitted successfully.',
    });
  }
);

// GET /partners/:id or slug
router.get('/:idOrSlug', async (req, res: Response) => {
  const { idOrSlug } = req.params;
  const { lat, lng } = req.query;

  const partner = await prisma.partner.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      verificationStatus: 'APPROVED',
    },
    include: {
      reviews: {
        where: { isVisible: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      },
      bags: {
        where: {
          status: { in: ['ACTIVE', 'LOW_STOCK'] },
          pickupEnd: { gt: new Date() },
        },
      },
    },
  });

  if (!partner) throw new AppError('Partner not found', 404);

  const distance =
    lat && lng
      ? calculateDistance(
          parseFloat(lat as string),
          parseFloat(lng as string),
          partner.latitude,
          partner.longitude
        )
      : null;

  res.json({ success: true, data: { ...partner, distance } });
});

// PATCH /partners/:id (partner only)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const partner = await prisma.partner.findFirst({
    where: { id: req.params.id, ownerUserId: req.user!.id },
  });
  if (!partner) throw new AppError('Partner not found', 404);

  const allowed = [
    'description',
    'phone',
    'email',
    'coverImage',
    'logoImage',
    'openingHours',
    'bankDetails',
  ];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const updated = await prisma.partner.update({
    where: { id: partner.id },
    data: updates,
  });

  res.json({ success: true, data: updated });
});

// GET /partners/:id/earnings (partner only)
router.get('/:id/earnings', authenticate, async (req: AuthRequest, res: Response) => {
  const partner = await prisma.partner.findFirst({
    where: { id: req.params.id, ownerUserId: req.user!.id },
  });
  if (!partner) throw new AppError('Partner not found', 404);

  const [today, thisWeek, thisMonth, allTime] = await Promise.all([
    getEarnings(partner.id, startOfDay()),
    getEarnings(partner.id, startOfWeek()),
    getEarnings(partner.id, startOfMonth()),
    getEarnings(partner.id, new Date(0)),
  ]);

  const recentPayouts = await prisma.payout.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { order: { select: { orderNumber: true, createdAt: true } } },
  });

  res.json({
    success: true,
    data: { today, thisWeek, thisMonth, allTime, recentPayouts },
  });
});

// GET /partners/:id/analytics (partner only)
router.get('/:id/analytics', authenticate, async (req: AuthRequest, res: Response) => {
  const partner = await prisma.partner.findFirst({
    where: { id: req.params.id, ownerUserId: req.user!.id },
  });
  if (!partner) throw new AppError('Partner not found', 404);

  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const [orders, bags, reviews] = await Promise.all([
    prisma.order.findMany({
      where: { partnerId: partner.id, createdAt: { gte: last30Days } },
      select: { total: true, orderStatus: true, createdAt: true },
    }),
    prisma.bag.findMany({
      where: { partnerId: partner.id, createdAt: { gte: last30Days } },
      select: { title: true, quantity: true, remainingQuantity: true, pickupStart: true },
    }),
    prisma.review.findMany({
      where: { partnerId: partner.id },
      select: { rating: true, tags: true },
    }),
  ]);

  const completedOrders = orders.filter((o) =>
    ['PICKED_UP', 'COMPLETED'].includes(o.orderStatus)
  );
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Most popular pickup hour
  const hourCounts: Record<number, number> = {};
  completedOrders.forEach((o) => {
    const hour = new Date(o.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  });
  const bestHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];

  res.json({
    success: true,
    data: {
      totalBagsPosted: bags.length,
      totalBagsSold: completedOrders.length,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      bestPickupHour: bestHour ? parseInt(bestHour[0]) : null,
      recentOrders: orders.slice(0, 10),
    },
  });
});

// ---- Helpers ----
async function getEarnings(partnerId: string, since: Date) {
  const payouts = await prisma.payout.findMany({
    where: { partnerId, createdAt: { gte: since } },
    select: { grossAmount: true, commission: true, netAmount: true },
  });

  return {
    grossAmount: payouts.reduce((s, p) => s + p.grossAmount, 0),
    commission: payouts.reduce((s, p) => s + p.commission, 0),
    netAmount: payouts.reduce((s, p) => s + p.netAmount, 0),
    bagsSold: payouts.length,
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

async function ensureUniqueSlug(slug: string, tx: any): Promise<string> {
  let candidate = slug;
  let counter = 0;
  while (true) {
    const existing = await tx.partner.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    counter++;
    candidate = `${slug}-${counter}`;
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(): Date {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default router;

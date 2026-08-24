import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /admin/dashboard
router.get('/dashboard', async (_req, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activePartners,
    bagsPostedToday,
    bagsSoldToday,
    totalRevenue,
    platformRevenue,
    pendingPartners,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CONSUMER' } }),
    prisma.partner.count({ where: { verificationStatus: 'APPROVED', isActive: true } }),
    prisma.bag.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({
      where: { createdAt: { gte: today }, orderStatus: { in: ['PICKED_UP', 'COMPLETED'] } },
    }),
    prisma.payout.aggregate({ _sum: { grossAmount: true } }),
    prisma.payout.aggregate({ _sum: { commission: true } }),
    prisma.partner.count({ where: { verificationStatus: 'PENDING' } }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      activePartners,
      bagsPostedToday,
      bagsSoldToday,
      totalGmv: totalRevenue._sum.grossAmount ?? 0,
      platformRevenue: platformRevenue._sum.commission ?? 0,
      pendingPartners,
    },
  });
});

// GET /admin/users
router.get('/users', async (req, res: Response) => {
  const { page = '1', limit = '20', role, q } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { name: { contains: q as string, mode: 'insensitive' } },
      { phone: { contains: q as string } },
      { email: { contains: q as string, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, data: users, meta: { total } });
});

// GET /admin/partners
router.get('/partners', async (req, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      where: status ? { verificationStatus: status as any } : {},
      include: {
        owner: { select: { id: true, name: true, phone: true } },
        documents: true,
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partner.count({ where: status ? { verificationStatus: status as any } : {} }),
  ]);

  res.json({ success: true, data: partners, meta: { total } });
});

// PATCH /admin/partners/:id/verify
router.patch('/partners/:id/verify', async (req, res: Response) => {
  const { status, note } = req.body;
  if (!['APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED'].includes(status)) {
    throw new AppError('Invalid status', 400);
  }

  const partner = await prisma.partner.update({
    where: { id: req.params.id },
    data: {
      verificationStatus: status,
      verificationNote: note,
      isActive: status === 'APPROVED',
    },
  });

  // Notify partner owner
  await prisma.notification.create({
    data: {
      userId: partner.ownerUserId,
      title: status === 'APPROVED' ? 'Partner Account Approved' : 'Partner Account Update',
      message:
        status === 'APPROVED'
          ? 'Your partner account has been approved. You can now create Surprise Bags.'
          : `Your partner account status: ${status}. ${note ?? ''}`,
      type: status === 'APPROVED' ? 'PARTNER_APPROVED' : 'PARTNER_REJECTED',
    },
  });

  res.json({ success: true, data: partner });
});

// GET /admin/orders
router.get('/orders', async (req, res: Response) => {
  const { page = '1', limit = '20', status } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: status ? { orderStatus: status as any } : {},
      include: {
        user: { select: { id: true, name: true, phone: true } },
        partner: { select: { id: true, businessName: true } },
        bag: { select: { id: true, title: true } },
        payment: { select: { status: true, method: true } },
      },
      skip,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where: status ? { orderStatus: status as any } : {} }),
  ]);

  res.json({ success: true, data: orders, meta: { total } });
});

// GET /admin/commission
router.get('/commission', async (_req, res: Response) => {
  const settings = await prisma.commissionSettings.findMany({
    orderBy: { effectiveFrom: 'desc' },
  });
  res.json({ success: true, data: settings });
});

// PATCH /admin/commission
router.patch('/commission', async (req, res: Response) => {
  const { platformFeeFixed, commissionPercent, taxPercent } = req.body;

  // Deactivate old
  await prisma.commissionSettings.updateMany({ data: { isActive: false } });

  // Create new
  const settings = await prisma.commissionSettings.create({
    data: {
      platformFeeFixed,
      commissionPercent,
      taxPercent: taxPercent ?? 0,
      isActive: true,
      effectiveFrom: new Date(),
    },
  });

  res.json({ success: true, data: settings });
});

// GET /admin/analytics
router.get('/analytics', async (_req, res: Response) => {
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);

  const [dailyOrders, topPartners, categoryBreakdown] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total) as revenue
      FROM orders
      WHERE created_at >= ${last30} AND order_status IN ('PICKED_UP', 'COMPLETED')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    prisma.partner.findMany({
      where: { verificationStatus: 'APPROVED' },
      orderBy: { rating: 'desc' },
      take: 10,
      select: { id: true, businessName: true, rating: true, totalRatings: true, city: true },
    }),
    prisma.bag.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
  ]);

  res.json({ success: true, data: { dailyOrders, topPartners, categoryBreakdown } });
});

export default router;

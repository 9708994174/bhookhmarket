import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { CreateReviewSchema } from '@bhookhmarket/shared';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /reviews
router.post('/', authenticate, validate(CreateReviewSchema), async (req: AuthRequest, res: Response) => {
  const { orderId, rating, tags, comment } = req.body;
  const userId = req.user!.id;

  // Verify order belongs to user and is completed
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, orderStatus: { in: ['PICKED_UP', 'COMPLETED'] } },
  });

  if (!order) throw new AppError('Order not found or not eligible for review', 400);

  // Check no duplicate review
  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) throw new AppError('Review already submitted', 409);

  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: { userId, partnerId: order.partnerId, orderId, rating, tags, comment },
    });

    // Update partner rating
    const allRatings = await tx.review.findMany({
      where: { partnerId: order.partnerId },
      select: { rating: true },
    });
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;

    await tx.partner.update({
      where: { id: order.partnerId },
      data: {
        rating: Math.round(avg * 10) / 10,
        totalRatings: allRatings.length,
      },
    });

    // Mark order as completed
    await tx.order.update({
      where: { id: orderId },
      data: { orderStatus: 'COMPLETED' },
    });

    return r;
  });

  res.status(201).json({ success: true, data: review });
});

// GET /reviews/partner/:partnerId
router.get('/partner/:partnerId', async (req, res: Response) => {
  const { page = '1', limit = '10' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { partnerId: req.params.partnerId, isVisible: true },
      include: { user: { select: { id: true, name: true, profileImage: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string),
    }),
    prisma.review.count({ where: { partnerId: req.params.partnerId, isVisible: true } }),
  ]);

  res.json({
    success: true,
    data: reviews,
    meta: { total, page: parseInt(page as string), limit: parseInt(limit as string) },
  });
});

export default router;

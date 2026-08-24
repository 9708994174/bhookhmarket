import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// POST /favorites/:partnerId
router.post('/:partnerId', authenticate, async (req: AuthRequest, res: Response) => {
  const { partnerId } = req.params;
  const userId = req.user!.id;

  const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
  if (!partner) throw new AppError('Partner not found', 404);

  await prisma.favorite.upsert({
    where: { userId_partnerId: { userId, partnerId } },
    create: { userId, partnerId },
    update: {},
  });

  res.json({ success: true, message: 'Added to favorites' });
});

// DELETE /favorites/:partnerId
router.delete('/:partnerId', authenticate, async (req: AuthRequest, res: Response) => {
  const { partnerId } = req.params;
  const userId = req.user!.id;

  await prisma.favorite.deleteMany({ where: { userId, partnerId } });
  res.json({ success: true, message: 'Removed from favorites' });
});

// GET /favorites
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: {
      partner: {
        include: {
          bags: {
            where: {
              status: { in: ['ACTIVE', 'LOW_STOCK'] },
              pickupEnd: { gt: new Date() },
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: favorites });
});

// PATCH /favorites/:partnerId/notify
router.patch('/:partnerId/notify', authenticate, async (req: AuthRequest, res: Response) => {
  const { notifyOnBag } = req.body;
  await prisma.favorite.update({
    where: { userId_partnerId: { userId: req.user!.id, partnerId: req.params.partnerId } },
    data: { notifyOnBag },
  });
  res.json({ success: true });
});

export default router;

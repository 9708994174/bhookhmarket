import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = '1', unread } = req.query;
  const skip = (parseInt(page as string) - 1) * 20;

  const where: any = { userId: req.user!.id };
  if (unread === 'true') where.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: 20,
    }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
  ]);

  res.json({ success: true, data: notifications, unreadCount });
});

// PATCH /notifications/read-all
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
});

// PATCH /notifications/:id/read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json({ success: true });
});

export default router;

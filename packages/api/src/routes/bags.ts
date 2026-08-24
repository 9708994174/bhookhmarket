import { Router, Response } from 'express';
import { authenticate, requirePartner, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { BagQuerySchema, CreateBagSchema, UpdateBagSchema } from '@bhookhmarket/shared';
import { discoverBags, getBagById, createBag, updateBag, deleteBag } from '../services/bag.service';

const router = Router();

// GET /bags — Discovery feed
router.get('/', validate(BagQuerySchema, 'query'), async (req, res: Response) => {
  const result = await discoverBags(req.query as any);
  res.json({ success: true, ...result });
});

// GET /bags/:id — Bag detail
router.get('/:id', async (req, res: Response) => {
  const { lat, lng } = req.query;
  const bag = await getBagById(
    req.params.id,
    lat ? parseFloat(lat as string) : undefined,
    lng ? parseFloat(lng as string) : undefined
  );
  res.json({ success: true, data: bag });
});

// POST /bags (partner only)
router.post(
  '/',
  authenticate,
  requirePartner,
  validate(CreateBagSchema),
  async (req: AuthRequest, res: Response) => {
    const partnerId = (req as any).partnerId;
    const bag = await createBag(partnerId, req.body);
    res.status(201).json({ success: true, data: bag });
  }
);

// PATCH /bags/:id (partner only)
router.patch(
  '/:id',
  authenticate,
  requirePartner,
  validate(UpdateBagSchema),
  async (req: AuthRequest, res: Response) => {
    const partnerId = (req as any).partnerId;
    const bag = await updateBag(req.params.id, partnerId, req.body);
    res.json({ success: true, data: bag });
  }
);

// DELETE /bags/:id (partner only)
router.delete(
  '/:id',
  authenticate,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    const partnerId = (req as any).partnerId;
    await deleteBag(req.params.id, partnerId);
    res.json({ success: true, message: 'Bag removed' });
  }
);

// GET /bags/partner/my-bags (partner only)
router.get(
  '/partner/my-bags',
  authenticate,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    const { prisma } = await import('../lib/prisma');
    const partnerId = (req as any).partnerId;
    const bags = await prisma.bag.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: bags });
  }
);

export default router;

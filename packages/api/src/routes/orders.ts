import { Router, Response } from 'express';
import { authenticate, requirePartner, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { CreateOrderSchema, CancelOrderSchema } from '@bhookhmarket/shared';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  verifyPickup,
  getPartnerOrders,
} from '../services/order.service';

const router = Router();

// POST /orders — Create order (consumer)
router.post(
  '/',
  authenticate,
  validate(CreateOrderSchema),
  async (req: AuthRequest, res: Response) => {
    const { bagId, quantity } = req.body;
    const order = await createOrder(req.user!.id, bagId, quantity);
    res.status(201).json({ success: true, data: order });
  }
);

// GET /orders — Consumer order list
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { tab } = req.query;
  const orders = await getUserOrders(req.user!.id, tab as string);
  res.json({ success: true, data: orders });
});

// GET /orders/:id — Order detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const order = await getOrderById(req.params.id, req.user!.id);
  res.json({ success: true, data: order });
});

// POST /orders/:id/cancel
router.post(
  '/:id/cancel',
  authenticate,
  validate(CancelOrderSchema),
  async (req: AuthRequest, res: Response) => {
    const result = await cancelOrder(req.params.id, req.user!.id, req.body.reason);
    res.json({ success: true, ...result });
  }
);

// POST /orders/:id/pickup — Partner verifies customer QR
router.post(
  '/:id/pickup',
  authenticate,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    const partnerId = (req as any).partnerId;
    const { pickupCode } = req.body;

    if (!pickupCode) {
      return res.status(400).json({ success: false, error: 'Pickup code required' });
    }

    const result = await verifyPickup(pickupCode, partnerId);
    res.json({ success: true, data: result });
  }
);

// GET /orders/partner/list — Partner orders
router.get(
  '/partner/list',
  authenticate,
  requirePartner,
  async (req: AuthRequest, res: Response) => {
    const partnerId = (req as any).partnerId;
    const { tab } = req.query;
    const orders = await getPartnerOrders(partnerId, tab as string ?? 'upcoming');
    res.json({ success: true, data: orders });
  }
);

export default router;

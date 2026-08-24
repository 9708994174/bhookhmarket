import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { CreatePaymentSchema, VerifyPaymentSchema } from '@bhookhmarket/shared';
import { createPaymentOrder, verifyPayment, handleWebhook } from '../services/payment.service';

const router = Router();

// POST /payments/create
router.post(
  '/create',
  authenticate,
  validate(CreatePaymentSchema),
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.body;
    const result = await createPaymentOrder(orderId, req.user!.id);
    res.json({ success: true, data: result });
  }
);

// POST /payments/verify (called after payment gateway returns)
router.post(
  '/verify',
  authenticate,
  validate(VerifyPaymentSchema),
  async (req: AuthRequest, res: Response) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
    const order = await verifyPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId
    );
    res.json({ success: true, data: order, message: 'Payment verified successfully' });
  }
);

// POST /payments/webhook — Razorpay webhook (raw body)
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  try {
    await handleWebhook(req.body as Buffer, signature);
    res.json({ success: true });
  } catch {
    res.status(400).json({ success: false, error: 'Invalid webhook' });
  }
});

export default router;

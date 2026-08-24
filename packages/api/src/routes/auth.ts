import { Router, Response } from 'express';
import { sendOtp, verifyOtp, googleAuth } from '../services/auth.service';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { SendOtpSchema, VerifyOtpSchema, GoogleAuthSchema, CreateProfileSchema } from '@bhookhmarket/shared';

const router = Router();

// POST /auth/send-otp
router.post(
  '/send-otp',
  authRateLimiter,
  otpRateLimiter,
  validate(SendOtpSchema),
  async (req, res: Response) => {
    const { phone } = req.body;
    const result = await sendOtp(phone);
    res.json({ success: true, ...result });
  }
);

// POST /auth/verify-otp
router.post(
  '/verify-otp',
  authRateLimiter,
  validate(VerifyOtpSchema),
  async (req, res: Response) => {
    const { phone, otp } = req.body;
    const result = await verifyOtp(phone, otp);
    res.json({ success: true, data: result });
  }
);

// POST /auth/google
router.post(
  '/google',
  authRateLimiter,
  validate(GoogleAuthSchema),
  async (req, res: Response) => {
    const { idToken } = req.body;
    const result = await googleAuth(idToken);
    res.json({ success: true, data: result });
  }
);

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      profileImage: true,
      isVerified: true,
      createdAt: true,
      partnerProfile: true,
      impactStats: true,
    },
  });

  if (!user) throw new AppError('User not found', 404);

  res.json({
    success: true,
    data: {
      ...user,
      partner: user.partnerProfile,
    },
  });
});

// PATCH /auth/profile
router.patch(
  '/profile',
  authenticate,
  validate(CreateProfileSchema),
  async (req: AuthRequest, res: Response) => {
    const { name, email, phone, profileImage } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(profileImage !== undefined && { profileImage }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profileImage: true,
      },
    });

    res.json({ success: true, data: user });
  }
);

// POST /auth/fcm-token
router.post('/fcm-token', authenticate, async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Token required' });

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { fcmToken: token },
  });

  res.json({ success: true, message: 'FCM token updated' });
});

// POST /auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user!.id },
    });
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { fcmToken: null },
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    phone: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      role: string;
      phone: string;
    };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, phone: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401);
    }

    req.user = { id: user.id, role: user.role, phone: user.phone };
    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Invalid or expired token', 401);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }
    next();
  };
};

export const requirePartner = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const partner = await prisma.partner.findUnique({
    where: { ownerUserId: req.user.id },
    select: { id: true, verificationStatus: true, isActive: true },
  });

  if (!partner) throw new AppError('Partner profile not found', 404);
  if (partner.verificationStatus !== 'APPROVED') {
    throw new AppError('Partner account pending verification', 403);
  }

  (req as any).partnerId = partner.id;
  next();
};

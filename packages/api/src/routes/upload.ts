import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400) as any);
    }
  },
});

// POST /upload/image
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const folder = (req.query.folder as string) ?? 'general';

    // If Cloudinary is not configured, return a placeholder
    if (!config.cloudinary.cloudName) {
      return res.json({
        success: true,
        data: {
          url: `https://via.placeholder.com/400x300?text=BhookhMarket`,
          publicId: 'placeholder',
        },
      });
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `bhookhmarket/${folder}`,
              transformation: [
                { width: 800, height: 600, crop: 'fill', quality: 'auto' },
              ],
            },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            }
          )
          .end(req.file!.buffer);
      }
    );

    res.json({ success: true, data: { url: result.secure_url, publicId: result.public_id } });
  }
);

export default router;

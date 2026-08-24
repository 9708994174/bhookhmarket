import { z } from 'zod';

// ---- Auth Schemas ----

export const SendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

export const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const CreateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')).or(z.null()),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
});

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1),
});

// ---- Bag Schemas ----

export const BaseBagSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    'BAKERY',
    'CAFE',
    'RESTAURANT',
    'HOTEL',
    'SUPERMARKET',
    'CATERER',
    'CLOUD_KITCHEN',
  ]),
  originalValue: z.number().min(1).max(10000),
  sellingPrice: z.number().min(1).max(10000),
  quantity: z.number().int().min(1).max(100),
  pickupStart: z.string(),
  pickupEnd: z.string(),
  imageUrl: z.string().url().optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isNonVegetarian: z.boolean().default(false),
  containsDairy: z.boolean().default(false),
  containsNuts: z.boolean().default(false),
  containsGluten: z.boolean().default(false),
  foodSafetyDeclared: z.boolean().default(true),
});

export const CreateBagSchema = BaseBagSchema.refine(
  (data) => data.sellingPrice < data.originalValue,
  {
    message: 'Selling price must be less than original value',
    path: ['sellingPrice'],
  }
).refine(
  (data) => new Date(data.pickupEnd) > new Date(data.pickupStart),
  {
    message: 'Pickup end must be after pickup start',
    path: ['pickupEnd'],
  }
);

export const UpdateBagSchema = BaseBagSchema.partial();

// ---- Order Schemas ----

export const CreateOrderSchema = z.object({
  bagId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10),
});

export const CancelOrderSchema = z.object({
  reason: z.string().min(3).max(500),
});

// ---- Review Schemas ----

export const CreateReviewSchema = z.object({
  orderId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  tags: z.array(z.string()).max(6).default([]),
  comment: z.string().max(500).optional(),
});

// ---- Partner Registration Schema ----

export const PartnerRegistrationSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(200),
  category: z.enum([
    'BAKERY',
    'CAFE',
    'RESTAURANT',
    'HOTEL',
    'SUPERMARKET',
    'CATERER',
    'CLOUD_KITCHEN',
  ]),
  description: z.string().max(1000).optional().or(z.literal('')).or(z.null()),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')).or(z.null()),
  address: z.string().min(1).max(500).optional().default('Main Street'),
  city: z.string().min(1).max(100).optional().default('Noida'),
  state: z.string().min(1).max(100).optional().default('Uttar Pradesh'),
  pincode: z.string().optional().default('201301'),
  latitude: z.number().min(-90).max(90).optional().default(28.6139),
  longitude: z.number().min(-180).max(180).optional().default(77.391),
  gstin: z.string().optional().or(z.literal('')).or(z.null()),
  fssaiNumber: z.string().optional().or(z.literal('')).or(z.null()),
});

// ---- Payment Schemas ----

export const CreatePaymentSchema = z.object({
  orderId: z.string().cuid(),
});

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  orderId: z.string().cuid(),
});

// ---- Bag Query Schema ----

export const BagQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(0.5).max(25).default(5),
  category: z
    .enum(['BAKERY', 'CAFE', 'RESTAURANT', 'HOTEL', 'SUPERMARKET', 'CATERER', 'CLOUD_KITCHEN'])
    .optional(),
  maxPrice: z.coerce.number().optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  availableNow: z.coerce.boolean().optional(),
  sort: z.enum(['distance', 'price', 'discount', 'rating', 'pickup']).default('distance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(100).optional(),
});

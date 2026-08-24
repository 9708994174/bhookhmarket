// =============================================================================
// BhookhMarket — Shared TypeScript Types
// =============================================================================

// ---- Enums ----
export type UserRole = 'CONSUMER' | 'PARTNER' | 'ADMIN';

export type VerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MORE_INFO_REQUIRED';

export type PartnerCategory =
  | 'BAKERY'
  | 'CAFE'
  | 'RESTAURANT'
  | 'HOTEL'
  | 'SUPERMARKET'
  | 'CATERER'
  | 'CLOUD_KITCHEN';

export type BagStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'LOW_STOCK'
  | 'SOLD_OUT'
  | 'EXPIRED'
  | 'CANCELLED';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'EXPIRED';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'PICKUP_REMINDER'
  | 'BAG_AVAILABLE'
  | 'BAG_SOLD_OUT'
  | 'FAVORITE_BAG_AVAILABLE'
  | 'REFUND_PROCESSED'
  | 'PARTNER_APPROVED'
  | 'PARTNER_REJECTED'
  | 'GENERAL';

// ---- Core DTOs ----

export interface UserDTO {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  role: UserRole;
  profileImage: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface PartnerDTO {
  id: string;
  businessName: string;
  slug: string;
  category: PartnerCategory;
  description: string | null;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  coverImage: string | null;
  logoImage: string | null;
  rating: number;
  totalRatings: number;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  distance?: number; // km, computed
}

export interface BagDTO {
  id: string;
  partnerId: string;
  partner: PartnerDTO;
  title: string;
  description: string | null;
  category: PartnerCategory;
  originalValue: number;
  sellingPrice: number;
  platformFee: number;
  discountPercent: number; // computed
  savingsAmount: number; // computed
  quantity: number;
  remainingQuantity: number;
  pickupStart: string;
  pickupEnd: string;
  imageUrl: string | null;
  status: BagStatus;
  dietary: {
    isVegetarian: boolean;
    isVegan: boolean;
    isNonVegetarian: boolean;
    containsDairy: boolean;
    containsNuts: boolean;
    containsGluten: boolean;
  };
  distance?: number; // km, computed from user location
}

export interface OrderDTO {
  id: string;
  orderNumber: string;
  userId: string;
  partnerId: string;
  partner: Pick<PartnerDTO, 'id' | 'businessName' | 'address' | 'latitude' | 'longitude' | 'logoImage'>;
  bagId: string;
  bag: Pick<BagDTO, 'id' | 'title' | 'imageUrl' | 'pickupStart' | 'pickupEnd' | 'originalValue' | 'sellingPrice'>;
  quantity: number;
  subtotal: number;
  platformFee: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  pickupCode: string | null;
  pickupQr: string | null;
  pickedUpAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrderDTO {
  orderId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

export interface ReviewDTO {
  id: string;
  userId: string;
  user: Pick<UserDTO, 'id' | 'name' | 'profileImage'>;
  partnerId: string;
  orderId: string;
  rating: number;
  tags: string[];
  comment: string | null;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

export interface ImpactStatsDTO {
  totalBagsRescued: number;
  totalMoneySaved: number;
  totalCo2Saved: number;
  totalFoodSaved: number;
}

// ---- API Response Wrappers ----

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// ---- Query Params ----

export interface BagQueryParams {
  lat?: number;
  lng?: number;
  radius?: number; // km, default 5
  category?: PartnerCategory;
  maxPrice?: number;
  minDiscount?: number;
  availableNow?: boolean;
  sort?: 'distance' | 'price' | 'discount' | 'rating' | 'pickup';
  page?: number;
  limit?: number;
  q?: string;
}

export interface CommissionSettings {
  platformFeeFixed: number;
  commissionPercent: number;
  taxPercent: number;
}

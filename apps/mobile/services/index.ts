import api from './api';
import { BagQueryParams } from '@bhookhmarket/shared';

// ---- Auth ----
export const authService = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),

  googleAuth: (idToken: string) => api.post('/auth/google', { idToken }),

  getMe: () => api.get('/auth/me'),

  updateProfile: async (data: { name?: string; email?: string; phone?: string; profileImage?: string }) => {
    return api.patch('/auth/profile', data);
  },
  updateFcmToken: (token: string) => api.post('/auth/fcm-token', { token }),
  logout: () => api.post('/auth/logout'),
};

// ---- Bags ----
export const bagService = {
  list: (params?: BagQueryParams) => api.get('/bags', { params }),
  discover: (params?: any) => api.get('/bags', { params }),
  getById: (id: string, lat?: number, lng?: number) =>
    api.get(`/bags/${id}`, { params: { lat, lng } }),
  create: (data: any) => api.post('/bags', data),
  update: (id: string, data: any) => api.patch(`/bags/${id}`, data),
  delete: (id: string) => api.delete(`/bags/${id}`),
  getMyBags: () => api.get('/bags/partner/my-bags'),
  getNearby: (lat: number, lng: number, radiusKm = 10) =>
    api.get('/bags/nearby', { params: { lat, lng, radiusKm } }),
};

// ---- Orders ----
export const orderService = {
  create: (bagId: string, quantity: number) =>
    api.post('/orders', { bagId, quantity }),
  list: (tab?: string) => api.get('/orders', { params: { tab } }),
  getById: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string, reason: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
  verifyPickup: (pickupCode: string) =>
    api.post(`/orders/verify/pickup`, { pickupCode }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  getPartnerOrders: (tab?: string) =>
    api.get('/orders/partner/list', { params: { tab } }),
};

// ---- Payments ----
export const paymentService = {
  createOrder: (orderId: string) => api.post('/payments/create', { orderId }),
  verify: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) => api.post('/payments/verify', data),
};

// ---- Partners ----
export const partnerService = {
  register: (data: any) => api.post('/partners/register', data),
  getById: (idOrSlug: string, lat?: number, lng?: number) =>
    api.get(`/partners/${idOrSlug}`, { params: { lat, lng } }),
  update: (id: string, data: any) => api.patch(`/partners/${id}`, data),
  getEarnings: (id: string) => api.get(`/partners/${id}/earnings`),
  getAnalytics: (id: string) => api.get(`/partners/${id}/analytics`),
};

// ---- Reviews ----
export const reviewService = {
  create: (data: { orderId: string; rating: number; tags: string[]; comment?: string }) =>
    api.post('/reviews', data),
  getForPartner: (partnerId: string, page = 1) =>
    api.get(`/reviews/partner/${partnerId}`, { params: { page } }),
};

// ---- Favorites ----
export const favoriteService = {
  add: (partnerId: string) => api.post(`/favorites/${partnerId}`),
  remove: (partnerId: string) => api.delete(`/favorites/${partnerId}`),
  list: () => api.get('/favorites'),
  toggleNotify: (partnerId: string, notifyOnBag: boolean) =>
    api.patch(`/favorites/${partnerId}/notify`, { notifyOnBag }),
};

// ---- Notifications ----
export const notificationService = {
  list: (page = 1, unread = false) =>
    api.get('/notifications', { params: { page, unread } }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ---- Upload ----
export const uploadService = {
  uploadImage: async (uri: string, folder = 'general') => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'image.jpg',
      type: 'image/jpeg',
    } as any);

    return api.post(`/upload/image?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

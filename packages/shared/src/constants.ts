// Popular Indian cities with coordinates
export const POPULAR_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  { name: 'Gurgaon', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185 },
];

// Commission & platform defaults
export const PLATFORM_FEE = 5; // Rs per order
export const COMMISSION_PERCENT = 30; // 30% from partner
export const TAX_PERCENT = 0; // GST handled separately

// OTP Constants
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;

// Bag thresholds
export const LOW_STOCK_THRESHOLD = 2;

// Order status display config
export const ORDER_STATUS_CONFIG = {
  PENDING_PAYMENT: { label: 'Payment Pending', color: '#F59E0B', actionable: true },
  CONFIRMED: { label: 'Confirmed', color: '#2E7D32', actionable: false },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: '#1A6B3A', actionable: true },
  PICKED_UP: { label: 'Picked Up', color: '#1565C0', actionable: false },
  COMPLETED: { label: 'Completed', color: '#2E7D32', actionable: false },
  CANCELLED: { label: 'Cancelled', color: '#C62828', actionable: false },
  REFUNDED: { label: 'Refunded', color: '#7B1FA2', actionable: false },
  EXPIRED: { label: 'Expired', color: '#636366', actionable: false },
};

// Bag categories
export const BAG_CATEGORIES = [
  { id: 'BAKERY', label: 'Bakery', color: '#D4A574' },
  { id: 'CAFE', label: 'Cafe', color: '#6F4E37' },
  { id: 'RESTAURANT', label: 'Restaurant', color: '#E8641A' },
  { id: 'HOTEL', label: 'Hotel', color: '#1A6B3A' },
  { id: 'SUPERMARKET', label: 'Supermarket', color: '#1565C0' },
  { id: 'CATERER', label: 'Caterer', color: '#7B1FA2' },
  { id: 'CLOUD_KITCHEN', label: 'Cloud Kitchen', color: '#D84315' },
];

// Review tags
export const REVIEW_TAGS = [
  { id: 'generous_portion', label: 'Generous portion' },
  { id: 'great_variety', label: 'Great variety' },
  { id: 'fresh_items', label: 'Fresh items' },
  { id: 'easy_pickup', label: 'Easy pickup' },
  { id: 'friendly_staff', label: 'Friendly staff' },
  { id: 'would_recommend', label: 'Would recommend' },
  { id: 'good_value', label: 'Good value' },
  { id: 'quick_pickup', label: 'Quick pickup' },
];

// Default radius options (km)
export const RADIUS_OPTIONS = [1, 2, 5, 10, 20];

// Default sort options
export const SORT_OPTIONS = [
  { id: 'distance', label: 'Distance' },
  { id: 'discount', label: 'Best Discount' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'rating', label: 'Rating' },
  { id: 'pickup_soonest', label: 'Pickup: Soonest' },
];

// Impact metrics (per bag saved)
export const IMPACT_PER_BAG = {
  co2SavedKg: 2.5,
  waterSavedLiters: 100,
  mealsSaved: 1,
};

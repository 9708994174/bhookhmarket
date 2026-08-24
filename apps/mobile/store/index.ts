import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  role: 'CONSUMER' | 'PARTNER' | 'ADMIN';
  profileImage: string | null;
  isVerified: boolean;
  partnerProfile?: {
    id: string;
    businessName: string;
    category?: string;
    verificationStatus: string;
    isActive: boolean;
    rating?: number;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  impactStats?: {
    totalBagsRescued: number;
    totalMoneySaved: number;
    totalCo2Saved: number;
    totalFoodSaved?: number;
  } | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;

  // Actions
  initialize: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => void;
  setNewUser: (value: boolean) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,
  isNewUser: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        set({ accessToken: token });
        const res = await authService.getMe();
        set({ user: res.data.data, isAuthenticated: true });
      }
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } finally {
      set({ isLoading: false });
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ accessToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  setNewUser: (value) => set({ isNewUser: value }),

  logout: async () => {
    try {
      await authService.logout();
    } catch {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false, isNewUser: false });
  },

  refreshUser: async () => {
    try {
      const res = await authService.getMe();
      set({ user: res.data.data });
    } catch {}
  },
}));

// ---- Location Store ----
interface Location {
  latitude: number;
  longitude: number;
  city: string;
  address: string;
}

interface LocationState {
  location: Location | null;
  permissionGranted: boolean;
  setLocation: (loc: Location) => void;
  setPermission: (granted: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  permissionGranted: false,
  setLocation: (location) => set({ location }),
  setPermission: (permissionGranted) => set({ permissionGranted }),
}));

// ---- Filter Store ----
interface FilterState {
  radius: number;
  category: string | null;
  maxPrice: number | null;
  minDiscount: number | null;
  availableNow: boolean;
  sort: string;
  setFilter: (key: string, value: any) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  radius: 5,
  category: null,
  maxPrice: null,
  minDiscount: null,
  availableNow: false,
  sort: 'distance',
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultFilters,
  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
  resetFilters: () => set(defaultFilters),
}));

// ---- UI Store for Tab Bar visibility ----
interface UIState {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTabBarVisible: true,
  setTabBarVisible: (visible: boolean) => set({ isTabBarVisible: visible }),
}));

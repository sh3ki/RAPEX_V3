import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string, role?: string) => Promise<void>;
  signupWithGoogle: (params: {
    idToken: string;
    role: string;
    phone: string;
    otpCode: string;
    fullName?: string;
    businessName?: string;
    adminSubRole?: string;
  }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const extractAuthPayload = (raw: any) => {
  const levelOne = raw?.data ?? raw;
  return levelOne?.data ?? levelOne;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get('access_token'),
  login: async (email, password) => {
    const { data } = await api.post('/auth/token/', { email, password });
    const payload = extractAuthPayload(data);
    Cookies.set('access_token', payload.access, { expires: 1 });
    Cookies.set('refresh_token', payload.refresh, { expires: 7 });
    set({ user: payload.user, isAuthenticated: true });
  },
  loginWithGoogle: async (idToken, role = 'ADMIN') => {
    const { data } = await api.post('/auth/google/login/', { id_token: idToken, role });
    const payload = extractAuthPayload(data);
    Cookies.set('access_token', payload.access, { expires: 1 });
    Cookies.set('refresh_token', payload.refresh, { expires: 7 });
    set({ user: payload.user, isAuthenticated: true });
  },
  signupWithGoogle: async ({ idToken, role, phone, otpCode, fullName, businessName, adminSubRole }) => {
    const { data } = await api.post('/auth/google/signup/', {
      id_token: idToken,
      role,
      phone,
      otp_code: otpCode,
      full_name: fullName,
      business_name: businessName,
      admin_sub_role: adminSubRole,
    });
    const payload = extractAuthPayload(data);
    Cookies.set('access_token', payload.access, { expires: 1 });
    Cookies.set('refresh_token', payload.refresh, { expires: 7 });
    set({ user: payload.user, isAuthenticated: true });
  },
  logout: () => {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },
  setUser: (user) => set({ user, isAuthenticated: true }),
}));

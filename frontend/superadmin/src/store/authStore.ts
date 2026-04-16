import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  phone: string | null;
  username?: string | null;
  role: string;
  status?: string;
  wizard_completed?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginWithGoogle: (idToken: string, role?: string) => Promise<void>;
  requestMagicLink: (email: string, role?: string, redirectUrl?: string) => Promise<{ debugLink?: string }>;
  verifyMagicLink: (email: string, token: string, role?: string) => Promise<void>;
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

  loginWithGoogle: async (idToken, role = 'SUPERADMIN') => {
    const { data } = await api.post('/auth/google/login/', { id_token: idToken, role });
    const payload = extractAuthPayload(data);
    Cookies.set('access_token', payload.access, { secure: true, sameSite: 'strict' });
    Cookies.set('refresh_token', payload.refresh, { secure: true, sameSite: 'strict' });
    set({ user: payload.user, isAuthenticated: true });
  },

  requestMagicLink: async (email, role = 'SUPERADMIN', redirectUrl = '') => {
    const { data } = await api.post('/auth/magic-link/request/', {
      email,
      role,
      redirect_url: redirectUrl || `${window.location.origin}/login`,
    });
    const payload = extractAuthPayload(data);
    return { debugLink: payload.debug_magic_link };
  },

  verifyMagicLink: async (email, token, role = 'SUPERADMIN') => {
    const { data } = await api.post('/auth/magic-link/verify/', { email, token, role });
    const payload = extractAuthPayload(data);
    Cookies.set('access_token', payload.access, { secure: true, sameSite: 'strict' });
    Cookies.set('refresh_token', payload.refresh, { secure: true, sameSite: 'strict' });
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

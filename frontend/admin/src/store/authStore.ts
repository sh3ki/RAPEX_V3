import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  phone: string | null;
  username?: string | null;
  first_name: string;
  last_name: string;
  role: string;
  status?: string;
  wizard_completed?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginWithPassword: (identifier: string, password: string, role?: string) => Promise<void>;
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
  loginWithPassword: async (identifier, password, role = 'ADMIN') => {
    const { data } = await api.post('/auth/token/', { identifier, password, role });
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
  requestMagicLink: async (email, role = 'ADMIN', redirectUrl = '') => {
    const { data } = await api.post('/auth/magic-link/request/', {
      email,
      role,
      redirect_url: redirectUrl || `${window.location.origin}/auth/callback`,
    });
    const payload = extractAuthPayload(data);
    return { debugLink: payload.debug_magic_link };
  },
  verifyMagicLink: async (email, token, role = 'ADMIN') => {
    const { data } = await api.post('/auth/magic-link/verify/', { email, token, role });
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

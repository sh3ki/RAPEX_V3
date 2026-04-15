import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User { id: string; email: string; phone: string; first_name: string; last_name: string; role: string; }
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get('access_token'),
  login: async (email, password) => {
    const { data } = await api.post('/auth/token/', { email, password });
    Cookies.set('access_token', data.access, { expires: 1 });
    Cookies.set('refresh_token', data.refresh, { expires: 7 });
    set({ user: data.user, isAuthenticated: true });
  },
  logout: () => { Cookies.remove('access_token'); Cookies.remove('refresh_token'); set({ user: null, isAuthenticated: false }); window.location.href = '/login'; },
  setUser: (user) => set({ user, isAuthenticated: true }),
}));

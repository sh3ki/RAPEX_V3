import axios from 'axios';
import Cookies from 'js-cookie';
import { clearAuthState } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = Cookies.get('refresh_token');
        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
        Cookies.set('access_token', data.data.access, { secure: true, sameSite: 'strict' });
        originalRequest.headers.Authorization = `Bearer ${data.data.access}`;
        return api(originalRequest);
      } catch {
        clearAuthState();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

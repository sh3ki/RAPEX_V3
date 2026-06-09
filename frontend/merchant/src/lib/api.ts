import axios from 'axios';
import Cookies from 'js-cookie';
import { clearAuthState } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    const payload = res.data;
    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      'data' in payload
    ) {
      return { ...res, data: payload.data };
    }
    return res;
  },
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        try {
          const refreshResponse = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
          const accessToken = refreshResponse.data?.data?.access || refreshResponse.data?.access;

          if (!accessToken) {
            throw new Error('Missing access token in refresh response');
          }

          Cookies.set('access_token', accessToken, { expires: 1 });
          orig.headers = orig.headers || {};
          orig.headers.Authorization = `Bearer ${accessToken}`;
          return api(orig);
        } catch { clearAuthState(); window.location.href = '/login'; }
      } else { clearAuthState(); window.location.href = '/login'; }
    }
    return Promise.reject(error);
  },
);

export default api;

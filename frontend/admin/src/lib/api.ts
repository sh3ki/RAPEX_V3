import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — auto-refresh on 401
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
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        try {
          const refreshResponse = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
          const accessToken = refreshResponse.data?.data?.access || refreshResponse.data?.access;

          if (!accessToken) {
            throw new Error('Missing access token in refresh response');
          }

          Cookies.set('access_token', accessToken, { expires: 1 });
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

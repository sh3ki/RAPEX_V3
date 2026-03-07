import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
          Cookies.set('access_token', data.access, { expires: 1 });
          orig.headers.Authorization = `Bearer ${data.access}`;
          return api(orig);
        } catch { Cookies.remove('access_token'); Cookies.remove('refresh_token'); window.location.href = '/login'; }
      } else { window.location.href = '/login'; }
    }
    return Promise.reject(error);
  },
);

export default api;

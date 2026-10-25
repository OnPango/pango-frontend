import axios from 'axios';
import { env } from '@/core/config/env';

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('pango-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      const token = parsed?.state?.token ?? parsed?.token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
};

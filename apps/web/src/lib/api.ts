import axios from 'axios';
import { toast } from 'sonner';
import { env } from './env';
import { ROUTES } from '@/constants/routes';
import { getToken, clearToken } from './auth-token';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Is the backend running?';
    }

    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;

    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
  }

  return 'Something went wrong. Please try again.';
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        clearToken();
        if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
          window.location.href = ROUTES.LOGIN;
        }
      }
      return Promise.reject(error);
    }

    // 409 conflicts are handled by the calling feature (schedule dialog).
    if (!(axios.isAxiosError(error) && error.response?.status === 409)) {
      toast.error(extractErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

export { extractErrorMessage };

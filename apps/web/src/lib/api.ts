import axios, { type AxiosError } from 'axios';
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

type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

export type ApiErrorLike =
  | string
  | Error
  | AxiosError<ApiErrorBody>
  | {
      message?: string | string[];
      code?: string;
      response?: {
        status?: number;
        data?: ApiErrorBody;
      };
    };

function readBodyMessage(data: ApiErrorBody | undefined): string | null {
  if (!data) return null;
  if (Array.isArray(data.message)) return data.message.join(', ');
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return null;
}

function extractErrorMessage(error: ApiErrorLike): string {
  if (typeof error === 'string') return error;

  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Is the backend running?';
    }
    const fromBody = readBodyMessage(error.response?.data);
    if (fromBody) return fromBody;
  }

  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error !== null) {
    if (Array.isArray(error.message)) return error.message.join(', ');
    if (typeof error.message === 'string' && error.message) return error.message;
    if ('response' in error) {
      const fromBody = readBodyMessage(error.response?.data);
      if (fromBody) return fromBody;
    }
  }

  return 'Something went wrong. Please try again.';
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        clearToken();
        if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
          window.location.href = ROUTES.LOGIN;
        }
      }
      return Promise.reject(error);
    }

    if (error.response?.status !== 409) {
      toast.error(extractErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

export { extractErrorMessage };

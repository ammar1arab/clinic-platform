import { getTranslations, getLanguage } from '@/i18n';
import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';
import { env } from './env';
import { ROUTES } from '@/constants/routes';
import { ENDPOINTS } from '@/constants/endpoints';
import type { AuthErrorCode } from '@clinic/types';
import { getToken, clearToken } from './auth-token';
import { createLogger } from './logger';

const log = createLogger('api');

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !isAuthFlowRequest(config.url)) config.headers.Authorization = `Bearer ${token}`;

  config.headers['Accept-Language'] = getLanguage();

  return config;
});

type ApiErrorBody =
  | string
  | {
      message?: string | string[];
      error?: string;
      code?: AuthErrorCode;
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

function readBodyMessage(
  data: Exclude<ApiErrorBody, string> | undefined,
): string | null {
  if (!data) return null;
  if (data.code && Object.prototype.hasOwnProperty.call(getTranslations().auth.errors, data.code)) return getTranslations().auth.errors[data.code];
  if (Array.isArray(data.message)) return data.message.join(', ');
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  return null;
}

function extractErrorMessage(error: ApiErrorLike): string {
  if (typeof error === 'string') return error;

  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.code === 'ERR_NETWORK') {
      return getTranslations().errors.network;
    }
    const raw = error.response?.data;
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim().slice(0, 200);
    }
    const fromBody = readBodyMessage(
      typeof raw === 'object' && raw !== null ? raw : undefined,
    );
    if (fromBody) return fromBody;
  }

  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error !== null) {
    if (Array.isArray(error.message)) return error.message.join(', ');
    if (typeof error.message === 'string' && error.message)
      return error.message;
    if ('response' in error) {
      const data = error.response?.data;
      if (typeof data === 'string' && data.trim())
        return data.trim().slice(0, 200);
      const fromBody = readBodyMessage(
        typeof data === 'object' && data !== null ? data : undefined,
      );
      if (fromBody) return fromBody;
    }
  }

  return getTranslations().errors.generic;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase() ?? null;
    const url = error.config?.url ?? null;
    const message = extractErrorMessage(error);
    const meta = {
      method,
      url,
      status: status ?? null,
      message,
      code: error.code ?? null,
    };

    if (isAuthFlowRequest(error.config?.url)) return Promise.reject(error);

    if (status === 401) {
      log.warn('unauthorized', meta);
      if (typeof window !== 'undefined') {
        clearToken();
        if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
          window.location.href = ROUTES.LOGIN;
        }
      }
      return Promise.reject(error);
    }

    if (!status || status >= 500) {
      log.error('response_failed', meta);
    } else if (status !== 409 && !shouldSkipErrorToast(error)) {
      log.warn('response_failed', meta);
    }

    if (status !== 409 && !shouldSkipErrorToast(error)) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

function shouldSkipErrorToast(error: AxiosError<ApiErrorBody>): boolean {
  const method = error.config?.method?.toLowerCase();
  if (method && method !== 'get' && method !== 'head') return false;

  const message = extractErrorMessage(error);
  if (/^Cannot (GET|HEAD)\b/i.test(message)) return true;

  if (
    error.response?.status === 404 &&
    typeof error.response.data === 'string' &&
    /^Cannot (GET|HEAD)\b/i.test(error.response.data)
  ) {
    return true;
  }

  return false;
}

function isAuthFlowRequest(url?: string): boolean {
  return !!url && Object.values(ENDPOINTS.AUTH).some(endpoint => endpoint !== ENDPOINTS.AUTH.ME && endpoint === url);
}

export { extractErrorMessage };

export function isHttpStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}

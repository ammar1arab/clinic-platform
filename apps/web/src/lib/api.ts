import { getTranslations, getLanguage } from '@/i18n';
import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';
import { env } from './env';
import { ROUTES } from '@/constants/routes';
import { ENDPOINTS } from '@/constants/endpoints';
import type { AuthErrorCode, VisitErrorCode } from '@clinic/types';
import { createLogger } from './logger';
import { getAuthSessionRevision, publishAuthSessionChange } from './auth-session';

const log = createLogger('api');
const requestSessions = new WeakMap<object, number>();

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  requestSessions.set(config, getAuthSessionRevision().revision);
  config.headers['Accept-Language'] = getLanguage();

  return config;
});

type ApiErrorBody =
  | string
  | {
      message?: string | string[];
      error?: string;
      code?: AuthErrorCode | VisitErrorCode;
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
  if (data.code && Object.prototype.hasOwnProperty.call(getTranslations().auth.errors, data.code)) return getTranslations().auth.errors[data.code as AuthErrorCode];
  if (data.code && Object.prototype.hasOwnProperty.call(getTranslations().errors, data.code)) return getTranslations().errors[data.code as VisitErrorCode | keyof ReturnType<typeof getTranslations>["errors"]];
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

    if (isAuthFlowRequest(error.config?.url) || (url === ENDPOINTS.AUTH.ME || url === ENDPOINTS.AUTH.SESSION)) return Promise.reject(error);

    if (status === 401) {
      const revision = error.config && requestSessions.get(error.config);
      if (revision !== undefined && revision !== getAuthSessionRevision().revision) return Promise.reject(error);
      log.debug('unauthorized', meta);
      if (typeof window !== 'undefined') {
        publishAuthSessionChange(false);
        if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
          window.location.replace(ROUTES.LOGIN);
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
  return !!url && [
    ENDPOINTS.AUTH.LOGIN,
    ENDPOINTS.AUTH.GUEST,
    ENDPOINTS.AUTH.SEND_OTP,
    ENDPOINTS.AUTH.VERIFY_OTP,
    ENDPOINTS.AUTH.SET_PASSWORD,
    ENDPOINTS.AUTH.FORGOT_PASSWORD,
    ENDPOINTS.AUTH.RESET_PASSWORD,
    ENDPOINTS.AUTH.LOGOUT,
    ENDPOINTS.AUTH.PROFILE_EMAIL_CONFIRM,
    ENDPOINTS.AUTH.PROFILE_PASSWORD_CONFIRM,
  ].some(endpoint => endpoint === url);
}

export { extractErrorMessage };

export function isHttpStatus(error: unknown, status: number): boolean {
  return axios.isAxiosError(error) && error.response?.status === status;
}

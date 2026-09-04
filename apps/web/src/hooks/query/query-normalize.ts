import { getTranslations } from '@/i18n';
import axios from 'axios';

export interface IMessageError {
  message?: string | string[];
  statusCode?: number;
  error?: string;
}

export type TResponse<T> = T | { data: T };
export type TResponseError = Error | IMessageError;

export function isWrappedData<T>(
  response: TResponse<T>,
): response is { data: T } {
  return typeof response === 'object' && response !== null && 'data' in response;
}

export function unwrapResponse<T>(
  response: TResponse<T>,
  skipNormalization?: boolean,
): T {
  if (!skipNormalization && isWrappedData(response)) return response.data;
  return response as T;
}

export function toMessageError(
  error: unknown,
): IMessageError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'object' && data !== null) return data as IMessageError;
  }
  if (typeof error === 'object' && error !== null) return error as IMessageError;
  if (typeof error === 'string') return { message: error };
  return { message: getTranslations().errors.generic };
}

export function errorText(error: unknown): string {
  const msg = toMessageError(error).message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg || getTranslations().errors.generic;
}

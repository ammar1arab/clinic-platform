import {
  type QueryKey,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import axios from 'axios';
import { toQueryOptions } from '../query-presets';

export interface IMessageError {
  message?: string | string[];
  statusCode?: number;
  error?: string;
}

export type TResponse<T> = T | { data: T };
export type TResponseError = Error | IMessageError;

export function isNotFoundError(error: Error | IMessageError | null | undefined): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 404;
  }
  return false;
}

export interface IFetchDataOptions {
  keepPreviousData?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchOnReconnect?: boolean;
  enabled?: boolean;
  retry?: boolean | number;
  cacheEnabled?: boolean;
  staleTime?: number;
  skipNormalization?: boolean;
  gcTime?: number;
}

export interface IUseFetchData<T> {
  queryKey: QueryKey;
  request: () => Promise<TResponse<T>> | Promise<T>;
  options?: IFetchDataOptions;
  callback?: (_data: T) => void;
  errorCallback?: (_error: IMessageError) => void;
}

export type TUseFetchDataResult<T> = UseQueryResult<T, TResponseError> & {
  isNotFound: boolean;
};

function isWrappedData<T>(response: TResponse<T>): response is { data: T } {
  return typeof response === 'object' && response !== null && 'data' in response;
}

function toMessageError(error: object | string | null | undefined): IMessageError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'object' && data !== null) {
      return data as IMessageError;
    }
  }
  if (typeof error === 'object' && error !== null) {
    return error as IMessageError;
  }
  return { message: 'Something went wrong. Please try again.' };
}

export const useFetchData = <T>({
  queryKey,
  request,
  options,
  callback,
  errorCallback,
}: IUseFetchData<T>): TUseFetchDataResult<T> => {
  const queryClient = useQueryClient();
  const initialData = options?.cacheEnabled
    ? queryClient.getQueryData<T>(queryKey)
    : undefined;

  const queryResult = useQuery<T, TResponseError>({
    queryKey,
    ...(initialData !== undefined ? { initialData } : {}),
    queryFn: async () => {
      try {
        let response: TResponse<T> | undefined;

        if (options?.cacheEnabled) {
          response = queryClient.getQueryData<T>(queryKey);
        }

        const cacheMiss =
          options?.cacheEnabled &&
          (!response || (typeof response === 'object' && JSON.stringify(response) === '{}'));

        if (!options?.cacheEnabled || cacheMiss) {
          response = await request();
        }

        if (!response) {
          throw new Error('Empty response');
        }

        if (!options?.skipNormalization && isWrappedData(response)) {
          callback?.(response.data);
          return response.data;
        }

        const data = response as T;
        callback?.(data);
        return data;
      } catch (error) {
        if (typeof error === 'object' || typeof error === 'string' || error == null) {
          errorCallback?.(toMessageError(error));
        } else {
          errorCallback?.({ message: 'Something went wrong. Please try again.' });
        }
        throw error;
      }
    },
    ...toQueryOptions(options),
  });

  return {
    ...queryResult,
    isNotFound: isNotFoundError(queryResult.error),
  };
};

export default useFetchData;

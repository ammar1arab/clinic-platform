import {
  type QueryKey,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import axios from 'axios';

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
  errorCallback?: (__error: IMessageError) => void;
}

export type TUseFetchDataResult<T> = UseQueryResult<T, TResponseError> & {
  isNotFound: boolean;
};

export const useFetchData = <T>({
  queryKey,
  request,
  options,
  callback,
  errorCallback,
}: IUseFetchData<T>): TUseFetchDataResult<T> => {
  const queryClient = useQueryClient();
  const initialData = options?.cacheEnabled
    ? (queryClient.getQueryData(queryKey) as T)
    : undefined;

  const queryOptions = {
    retry: options?.retry ?? false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    ...(options ?? {}),
  };

  const queryResult = useQuery<T, TResponseError>({
    queryKey,
    ...(initialData !== undefined ? { initialData } : {}),
    queryFn: async () => {
      try {
        let response!: Awaited<T | { data: T }>;
        if (options?.cacheEnabled) {
          response = queryClient.getQueryData(queryKey) as Awaited<T>;
        }

        if (
          (options?.cacheEnabled && (!response || JSON.stringify(response) === '{}')) ||
          !options?.cacheEnabled
        ) {
          response = (await request()) as Awaited<T | { data: T }>;
        }

        if (response && typeof response === 'object' && 'data' in response && !options?.skipNormalization) {
          const data = (response as { data: T }).data;
          callback?.(data);
          return data;
        }

        callback?.(response as T);
        return response as T;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          errorCallback?.(error.response?.data as IMessageError);
        } else {
          errorCallback?.(error as IMessageError);
        }
        throw error;
      }
    },
    ...queryOptions,
  });

  return {
    ...queryResult,
    isNotFound: isNotFoundError(queryResult.error),
  };
};

export default useFetchData;

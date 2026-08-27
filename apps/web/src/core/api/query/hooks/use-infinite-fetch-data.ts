import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import { type IMessageError, type TResponseError } from './use-fetch-data';
import { toQueryOptions } from '../query-presets';

export interface IInfiniteFetchDataOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchOnReconnect?: boolean;
  retry?: boolean | number;
  staleTime?: number;
  gcTime?: number;
  cacheEnabled?: boolean;
  skipNormalization?: boolean;
  keepPreviousData?: boolean;
}

export interface IUseInfiniteFetchData<TPage> {
  queryKey: QueryKey;
  request: (pageParam: number) => Promise<TPage>;
  getNextPageParam: (lastPage: TPage, allPages: TPage[]) => number | undefined;
  initialPageParam?: number;
  options?: IInfiniteFetchDataOptions;
  errorCallback?: (error: IMessageError) => void;
  callback?: (data: TPage) => void;
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

export function useInfiniteFetchData<TPage>({
  queryKey,
  request,
  getNextPageParam,
  initialPageParam = 1,
  options,
  errorCallback,
  callback,
}: IUseInfiniteFetchData<TPage>): UseInfiniteQueryResult<InfiniteData<TPage>, TResponseError> {
  const queryClient = useQueryClient();

  return useInfiniteQuery<TPage, TResponseError, InfiniteData<TPage>, QueryKey, number>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      try {
        let response: TPage | undefined;

        if (options?.cacheEnabled) {
          response = queryClient.getQueryData<TPage>(queryKey);
        }

        const cacheMiss =
          options?.cacheEnabled &&
          (!response || (typeof response === 'object' && JSON.stringify(response) === '{}'));

        if (!options?.cacheEnabled || cacheMiss) {
          response = await request(pageParam);
        }

        if (response === undefined) {
          throw new Error('Empty response');
        }

        callback?.(response);
        return response;
      } catch (error) {
        if (typeof error === 'object' || typeof error === 'string' || error == null) {
          errorCallback?.(toMessageError(error));
        } else {
          errorCallback?.({ message: 'Something went wrong. Please try again.' });
        }
        throw error;
      }
    },
    initialPageParam,
    getNextPageParam,
    ...toQueryOptions(options),
  });
}

export default useInfiniteFetchData;

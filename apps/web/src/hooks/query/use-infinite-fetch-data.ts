import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';
import axios from 'axios';
import { createLogger } from '@/lib/logger';
import {
  errorText,
  toMessageError,
  type IMessageError,
  type TResponseError,
} from './query-normalize';
import { toQueryOptions, type FetchOptions } from './query-presets';

const log = createLogger('hooks/infinite');

export type UseInfiniteFetchDataArgs<TPage> = {
  queryKey: QueryKey;
  request: (pageParam: number) => Promise<TPage>;
  getNextPageParam: (lastPage: TPage, allPages: TPage[]) => number | undefined;
  initialPageParam?: number;
  options?: FetchOptions;
  onSuccess?: (data: TPage) => void;
  onError?: (error: IMessageError) => void;
};

export function useInfiniteFetchData<TPage>({
  queryKey,
  request,
  getNextPageParam,
  initialPageParam = 1,
  options,
  onSuccess,
  onError,
}: UseInfiniteFetchDataArgs<TPage>): UseInfiniteQueryResult<
  InfiniteData<TPage>,
  TResponseError
> {
  return useInfiniteQuery<
    TPage,
    TResponseError,
    InfiniteData<TPage>,
    QueryKey,
    number
  >({
    queryKey,
    initialPageParam,
    getNextPageParam,
    queryFn: async ({ pageParam }) => {
      try {
        const page = await request(pageParam);
        onSuccess?.(page);
        return page;
      } catch (error) {
        onError?.(toMessageError(error));
        const meta = {
          queryKey: JSON.stringify(queryKey),
          pageParam,
          message: errorText(error),
        };
        if (axios.isAxiosError(error)) log.warn('fetch_failed', meta);
        else log.error('fetch_failed', meta);
        throw error;
      }
    },
    ...toQueryOptions(options),
  });
}

export type {
  UseInfiniteFetchDataArgs as IUseInfiniteFetchData,
  FetchOptions as IInfiniteFetchDataOptions,
};

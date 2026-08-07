import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import { IMessageError, TResponseError } from './use-fetch-data';

export interface IInfiniteFetchDataOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean | 'always';
  refetchOnReconnect?: boolean;
  retry?: boolean | number;
  staleTime?: number;
  gcTime?: number;
}

export interface IUseInfiniteFetchData<TPage> {
  queryKey: QueryKey;
  request: (pageParam: number) => Promise<TPage>;
  getNextPageParam: (lastPage: TPage, allPages: TPage[]) => number | undefined;
  initialPageParam?: number;
  options?: IInfiniteFetchDataOptions & { cacheEnabled?: boolean; skipNormalization?: boolean };
  errorCallback?: (error: IMessageError) => void;
  callback?: (data: TPage) => void;
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

  const queryOptions = {
    retry: options?.retry ?? false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    ...(options ?? {}),
  };

  return useInfiniteQuery<TPage, TResponseError, InfiniteData<TPage>, QueryKey, number>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      try {
        let response!: Awaited<TPage>;
        if (options?.cacheEnabled) {
          response = queryClient.getQueryData(queryKey) as Awaited<TPage>;
        }
        if (
          (options?.cacheEnabled && (!response || JSON.stringify(response) === '{}')) ||
          !options?.cacheEnabled
        ) {
          response = (await request(pageParam)) as Awaited<TPage>;
        }
        callback?.(response as TPage);
        return response;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          errorCallback?.(error.response?.data as IMessageError);
        } else {
          errorCallback?.(error as IMessageError);
        }
        throw error;
      }
    },
    initialPageParam,
    getNextPageParam,
    ...queryOptions,
  });
}

export default useInfiniteFetchData;

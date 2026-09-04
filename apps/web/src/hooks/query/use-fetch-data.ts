import {
  type QueryKey,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import axios from "axios";
import { createLogger } from "@/lib/logger";
import {
  errorText,
  toMessageError,
  unwrapResponse,
  type IMessageError,
  type TResponse,
  type TResponseError,
} from "./query-normalize";
import { toQueryOptions, type FetchOptions } from "./query-presets";

export type { IMessageError, TResponse, TResponseError, FetchOptions };

const log = createLogger("hooks/query");

export function isNotFoundError(
  error: Error | IMessageError | null | undefined,
): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export type UseFetchDataArgs<T> = {
  queryKey: QueryKey;
  request: () => Promise<TResponse<T>> | Promise<T>;
  options?: FetchOptions;
};

export type UseFetchDataResult<T> = UseQueryResult<T, TResponseError> & {
  isNotFound: boolean;
};

export function useFetchData<T>({
  queryKey,
  request,
  options,
}: UseFetchDataArgs<T>): UseFetchDataResult<T> {
  const queryResult = useQuery<T, TResponseError>({
    queryKey,
    queryFn: async () => {
      try {
        const raw = await request();
        return unwrapResponse(raw, options?.skipNormalization);
      } catch (error) {
        const status = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;
        const meta = {
          message: errorText(error),
          status: status ?? null,
          queryKey: JSON.stringify(queryKey),
        };
        if (axios.isAxiosError(error)) log.warn("fetch_failed", meta);
        else log.error("fetch_failed", meta);
        throw toMessageError(error);
      }
    },
    ...toQueryOptions(options),
  });

  return {
    ...queryResult,
    isNotFound: isNotFoundError(queryResult.error),
  };
}

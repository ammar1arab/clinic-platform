import { QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 401) return false;
  if (isAxiosError(error) && !error.response) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;

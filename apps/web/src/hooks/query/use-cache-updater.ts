import { type QueryKey, useQueryClient } from '@tanstack/react-query';

export function useCacheUpdater<T>(queryKey: QueryKey) {
  const queryClient = useQueryClient();

  return {
    updateData: (next: T | ((prev: T | undefined) => T)) => {
      if (typeof next === 'function') {
        queryClient.setQueryData(queryKey, next as (prev: T | undefined) => T);
        return;
      }
      if (queryClient.getQueryData(queryKey) === undefined) return;
      queryClient.setQueryData(queryKey, next);
    },
  };
}

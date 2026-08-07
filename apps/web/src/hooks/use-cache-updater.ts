import { type QueryKey, useQueryClient } from '@tanstack/react-query';

export const useCacheUpdater = <T>(queryKey: QueryKey): { updateData: (newData: T | ((prev: T | undefined) => T)) => void } => {
  const queryClient = useQueryClient();

  const updateData = (newData: T | ((prev: T | undefined) => T)): void => {
    if (typeof newData === 'function') {
      queryClient.setQueryData(queryKey, newData as (prev: T | undefined) => T);
    } else {
      const existingData = queryClient.getQueryData(queryKey);
      if (existingData === undefined) {
        return;
      }
      queryClient.setQueryData(queryKey, newData);
    }
  };

  return { updateData };
};

export default useCacheUpdater;

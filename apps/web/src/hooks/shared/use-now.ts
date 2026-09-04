import { useSyncExternalStore, useCallback } from 'react';

let currentTimestamp = typeof Date !== 'undefined' ? Date.now() : 0;

export function useNow(intervalMs = 30_000): Date {
  const subscribeFn = useCallback((onStoreChange: () => void) => {
    const id = setInterval(() => {
      currentTimestamp = Date.now();
      onStoreChange();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const getSnapshot = useCallback(() => currentTimestamp, []);
  const getServerSnapshot = useCallback(() => 0, []);

  const timestamp = useSyncExternalStore(subscribeFn, getSnapshot, getServerSnapshot);
  return new Date(timestamp || currentTimestamp);
}

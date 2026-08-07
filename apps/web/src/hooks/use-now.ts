import { useSyncExternalStore } from 'react';

let currentTimestamp = typeof Date !== 'undefined' ? Date.now() : 0;

export function useNow(intervalMs = 30_000): Date {
  const timestamp = useSyncExternalStore(
    (onStoreChange) => {
      const id = setInterval(() => {
        currentTimestamp = Date.now();
        onStoreChange();
      }, intervalMs);
      return () => clearInterval(id);
    },
    () => currentTimestamp,
    () => 0,
  );
  return new Date(timestamp || currentTimestamp);
}

export default useNow;

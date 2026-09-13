import { useCallback, useRef, useSyncExternalStore } from 'react';

export const DEBOUNCE_MS = 700;

export function useDebounce<T>(value: T, ms: number = DEBOUNCE_MS): T {
  const publishedRef = useRef(value);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (Object.is(publishedRef.current, value)) return () => {};
      const id = window.setTimeout(() => {
        publishedRef.current = value;
        onStoreChange();
      }, ms);
      return () => window.clearTimeout(id);
    },
    [value, ms],
  );

  return useSyncExternalStore(
    subscribe,
    () => publishedRef.current,
    () => value,
  );
}

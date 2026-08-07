import { useState, useCallback } from 'react';

function readSession<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

export function useSessionStorageState<T>(key: string, initial: T) {
  const [state, setStateInternal] = useState<T>(() => readSession(key, initial));
  const [prevKey, setPrevKey] = useState(key);

  if (key !== prevKey) {
    setPrevKey(key);
    setStateInternal(readSession(key, initial));
  }

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(key, JSON.stringify(next));
          }
        } catch {
          // ignore quota errors
        }
        return next;
      });
    },
    [key],
  );

  return [state, setState] as const;
}

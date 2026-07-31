import { useEffect, useState } from 'react';

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
  const [state, setState] = useState<T>(() => readSession(key, initial));

  useEffect(() => {
    setState(readSession(key, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only rehydrate when storage key changes
  }, [key]);

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {

    }
  }, [key, state]);

  return [state, setState] as const;
}

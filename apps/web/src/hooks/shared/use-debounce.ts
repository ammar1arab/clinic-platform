import { useEffect, useState } from 'react';

export const DEBOUNCE_MS = 700;

export function useDebounce<T>(value: T, ms: number = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);

  return debounced;
}

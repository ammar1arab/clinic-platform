'use client';

import { useSyncExternalStore, useCallback } from 'react';

function subscribe(query: string, onChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

export function useMediaQuery(query: string) {
  const subscribeFn = useCallback((onChange: () => void) => subscribe(query, onChange), [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribeFn, getSnapshot, getServerSnapshot);
}

export function useIsMobile(breakpoint = 768) {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}

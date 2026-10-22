import { useCallback, useState, useSyncExternalStore } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('hooks/session-storage');
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function readSessionState<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as T;
    const initialObject = isPlainObject(initial);
    const parsedObject = isPlainObject(parsed);
    if (initialObject && parsedObject) {
      return { ...initial, ...parsed };
    }
    if (initialObject !== parsedObject || Array.isArray(parsed) !== Array.isArray(initial) || typeof parsed !== typeof initial) {
      return initial;
    }
    return parsed;
  } catch (error) {
    log.warn('read_failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return initial;
  }
}

export function writeSessionState<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    log.warn('write_failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function useSessionStorageState<T>(key: string, initial: T) {
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const [state, setStateInternal] = useState<T>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  if (hydrated && key !== loadedKey) {
    setLoadedKey(key);
    setStateInternal(readSessionState(key, initial));
  }

  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateInternal((previous) => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(previous) : value;
      writeSessionState(key, next);
      return next;
    });
  }, [key]);

  return [state, setState] as const;
}

import { useState } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('hooks/session-storage');

function readSession<T>(key: string, initial: T): T {
  if (typeof window === 'undefined') return initial;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return initial;
    return { ...initial, ...(JSON.parse(raw) as Partial<T>) };
  } catch (error) {
    log.warn('read_failed', {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return initial;
  }
}

function writeSession<T>(key: string, value: T) {
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
  const [state, setStateInternal] = useState<T>(() => readSession(key, initial));
  const [prevKey, setPrevKey] = useState(key);

  if (key !== prevKey) {
    setPrevKey(key);
    setStateInternal(readSession(key, initial));
  }

  const setState = (value: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
      writeSession(key, next);
      return next;
    });
  };

  return [state, setState] as const;
}

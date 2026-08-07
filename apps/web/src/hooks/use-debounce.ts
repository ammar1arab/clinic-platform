import { useDeferredValue } from 'react';

export function useDebounce<T>(value: T, delay?: number): T {
  void delay;
  return useDeferredValue(value);
}

export default useDebounce;
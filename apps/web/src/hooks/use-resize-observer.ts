'use client';

import { useCallback, useRef } from 'react';

/**
 * Ref-callback ResizeObserver — no useEffect.
 * Call the returned callback as `ref={observe}`; it fires on attach and on every resize.
 */
export function useResizeObserver(onResize: (element: HTMLElement) => void) {
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const observerRef = useRef<ResizeObserver | null>(null);

  return useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const notify = () => onResizeRef.current(node);
    notify();

    const observer = new ResizeObserver(notify);
    observer.observe(node);
    observerRef.current = observer;
  }, []);
}

export default useResizeObserver;

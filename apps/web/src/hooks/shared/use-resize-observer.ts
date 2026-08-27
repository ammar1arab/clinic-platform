'use client';

import { useCallback, useRef } from 'react';

export function useResizeObserver(onResize: (element: HTMLElement) => void) {
  const observerRef = useRef<ResizeObserver | null>(null);

  return useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (!node) return;

      const notify = () => onResize(node);
      notify();

      const observer = new ResizeObserver(notify);
      observer.observe(node);
      observerRef.current = observer;
    },
    [onResize],
  );
}

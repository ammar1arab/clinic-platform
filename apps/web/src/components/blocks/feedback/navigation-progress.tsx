'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Top-of-viewport navigation progress — starts on internal link clicks,
 * completes when the route commits. Quiet, premium, Awwwards-adjacent.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = `${pathname}?${searchParams?.toString() ?? ''}`;
  const prevKey = useRef(key);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);
    timerRef.current = null;
    hideRef.current = null;
  };

  const start = () => {
    clearTimers();
    setVisible(true);
    setProgress(18);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) return p;
        const step = p < 55 ? 12 : p < 80 ? 5 : 1.5;
        return Math.min(92, p + step);
      });
    }, 120);
  };

  const done = () => {
    clearTimers();
    setProgress(100);
    hideRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 160);
  };

  // Kick off on same-origin link clicks (before the route paints).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = (event.target as HTMLElement | null)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      if (target.target === '_blank' || target.hasAttribute('download')) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const next = `${url.pathname}${url.search}`;
        const current = `${window.location.pathname}${window.location.search}`;
        if (next === current) return;
        start();
      } catch {
        // ignore invalid hrefs
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Complete when the URL actually changes.
  useEffect(() => {
    if (prevKey.current !== key) {
      prevKey.current = key;
      done();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => () => clearTimers(), []);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-300 h-[2.5px] overflow-hidden transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className="relative h-full origin-left overflow-hidden rounded-r-full bg-linear-to-r from-primary via-accent-teal to-warning transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      >
        <span className="absolute inset-0 animate-clinic-progress-shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />
      </div>
    </div>
  );
}

'use client';

import { useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

let isNavigating = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  document.addEventListener(
    'click',
    (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = (event.target as HTMLElement | null)?.closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return;
      }
      if (target.target === '_blank' || target.hasAttribute('download')) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const next = `${url.pathname}${url.search}`;
        const current = `${window.location.pathname}${window.location.search}`;
        if (next === current) return;
        isNavigating = true;
        notify();
      } catch {}
    },
    true,
  );
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams?.toString() ?? ''}`;

  const navigating = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    () => isNavigating,
    () => false,
  );

  return (
    <div
      key={key}
      aria-hidden
      style={{ opacity: navigating ? 1 : 0 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-300 h-[2.5px] overflow-hidden transition-opacity duration-200"
    >
      <div className="relative h-full origin-left overflow-hidden rounded-r-full bg-linear-to-r from-primary via-accent-teal to-warning transition-[width] duration-150 ease-out animate-clinic-progress-indeterminate">
        <span className="absolute inset-0 animate-clinic-progress-shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />
      </div>
    </div>
  );
}

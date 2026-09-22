'use client';

import { useRef, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

let isNavigating = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function markNavigating() {
  if (isNavigating) return;
  isNavigating = true;
  notify();
}

function clearNavigating() {
  if (!isNavigating) return;
  isNavigating = false;
  notify();
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
        markNavigating();
      } catch {}
    },
    true,
  );
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot() {
  return isNavigating;
}

function getServerSnapshot() {
  return false;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams?.toString() ?? ''}`;
  const settledKey = useRef(routeKey);
  const navigating = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (settledKey.current !== routeKey) {
    settledKey.current = routeKey;
    if (isNavigating) queueMicrotask(clearNavigating);
  }

  return (
    <div
      aria-hidden
      style={{ opacity: navigating ? 1 : 0 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-300 h-[2.5px] overflow-hidden transition-opacity duration-200"
    >
      <div className="relative h-full w-full origin-left overflow-hidden rounded-e-full bg-linear-to-r from-primary via-accent-teal to-warning rtl:origin-right animate-clinic-progress-indeterminate">
        <span className="absolute inset-0 animate-clinic-progress-shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { playRefreshSound } from '@/lib/feedback-sound';
import { queryClient } from '@/lib/query-client';

export const REFRESH_PARAM = '_cureva_refresh';

function RefreshAnimation({ progress, complete, visible }: { progress: number; complete: boolean; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 z-[60] flex justify-center transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
      }`}
      style={{ top: 'calc(var(--app-header-height) + 0.25rem)' }}
    >
      <svg viewBox="0 0 24 24" className="size-11 overflow-visible text-primary" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-muted-foreground/25" />
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${progress * 100} 100`}
          transform="rotate(-90 12 12)"
          className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
        />
        <path
          d="M12 6v11m-4-4 4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`origin-center transition-[transform,opacity] duration-300 ease-out ${
            visible && progress > 0 ? 'translate-y-1.5 opacity-0' : 'translate-y-0 opacity-90'
          }`}
        />
        <path
          d="M12 8v8M8 12h8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          className={`origin-center transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            visible && complete ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'
          }`}
        />
      </svg>
    </div>
  );
}

export function useAppRefresh({ animate = false }: { animate?: boolean } = {}) {
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  const refreshApp = async () => {
    if (refreshing) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const surface = animate ? document.querySelector<HTMLElement>('main') : null;
    if (surface && !reduceMotion) {
      surface.style.transition = 'translate 460ms cubic-bezier(0.16, 1, 0.3, 1)';
      surface.style.translate = '0 60px';
    }

    queryClient.clear();
    setProgress(0);
    setComplete(false);
    setRefreshing(true);
    if (animate) {
      window.requestAnimationFrame(() => setProgress(1));
      window.setTimeout(() => setComplete(true), reduceMotion ? 100 : 760);
    }
    playRefreshSound();
    try {
      navigator.vibrate?.([12, 35, 12]);
    } catch {}

    window.setTimeout(() => {
      const next = new URL(window.location.href);
      next.searchParams.set(REFRESH_PARAM, String(Date.now()));
      window.location.replace(next.href);
    }, animate && !reduceMotion ? 1120 : 420);
  };

  return {
    refreshing,
    refreshApp,
    animation: animate ? <RefreshAnimation progress={progress} complete={complete} visible={refreshing} /> : null,
  };
}

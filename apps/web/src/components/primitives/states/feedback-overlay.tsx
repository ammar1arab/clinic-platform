'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';
import { IconError, IconInfo, IconWarning } from '@/constants/icons';
import { playFeedbackSound } from '@/lib/feedback-sound';
import { cn } from '@/lib/utils';

export const SUCCESS_OVERLAY_MS = 800;

const variants = {
  error: { icon: IconError, color: 'bg-destructive text-primary-foreground' },
  warning: { icon: IconWarning, color: 'bg-warning text-primary-foreground' },
  info: { icon: IconInfo, color: 'bg-primary text-primary-foreground' },
};

function useSuccessSession(enabled: boolean, onClose: () => void, ms: number) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const played = useRef(false);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!enabled) {
        played.current = false;
        return () => {};
      }
      if (!played.current) {
        played.current = true;
        playFeedbackSound();
      }
      const id = window.setTimeout(() => {
        onCloseRef.current();
        onStoreChange();
      }, ms);
      return () => window.clearTimeout(id);
    },
    [enabled, ms],
  );

  useSyncExternalStore(
    subscribe,
    () => enabled,
    () => false,
  );
}

function SuccessMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-28 text-primary-foreground motion-safe:animate-clinic-success-pop"
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" className="fill-success" />
      <path d="M18 33.5 27 42.5 46 22" className="clinic-check-mark" />
    </svg>
  );
}

export function FeedbackOverlay({
  open,
  onClose,
  title,
  variant = 'success',
  durationMs = SUCCESS_OVERLAY_MS,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  variant?: 'success' | keyof typeof variants;
  durationMs?: number;
}) {
  useSuccessSession(open && variant === 'success', onClose, durationMs);

  if (!open) return null;

  const tone = variant === 'success' ? null : variants[variant];
  const Icon = tone?.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title}
      className="fixed inset-0 z-50 grid place-items-center bg-background"
    >
      {tone && Icon ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={cn('grid size-24 place-items-center rounded-full', tone.color)}>
            <Icon className="size-12" strokeWidth={2} aria-hidden />
          </div>
          <p className="max-w-[16rem] font-heading text-base font-semibold text-foreground">
            {title}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <SuccessMark />
          <p className="max-w-[16rem] font-heading text-base font-semibold text-foreground">
            {title}
          </p>
        </div>
      )}
    </div>
  );
}

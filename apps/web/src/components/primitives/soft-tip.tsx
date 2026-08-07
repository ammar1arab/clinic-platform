'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SoftTipProps {
  label: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  side?: 'top' | 'bottom';
  /** Keep native title as a fallback for long-press on some mobiles */
  nativeTitle?: boolean;
}

export function SoftTip({
  label,
  children,
  className,
  contentClassName,
  side = 'top',
  nativeTitle = false,
}: SoftTipProps) {
  const [open, setOpen] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  const clearHide = () => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const show = () => {
    clearHide();
    setOpen(true);
  };

  const hideSoon = (delay = 100) => {
    clearHide();
    hideTimer.current = window.setTimeout(() => setOpen(false), delay);
  };

  return (
    <span
      className={cn('relative inline-flex max-w-full', className)}
      title={nativeTitle ? label : undefined}
      onMouseEnter={show}
      onMouseLeave={() => hideSoon()}
      onFocus={show}
      onBlur={() => hideSoon()}
      onPointerDown={() => {
        show();
        hideSoon(1600);
      }}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-60 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2',
          'rounded-md border border-border/70 bg-foreground px-2 py-1 text-[11px] font-medium leading-snug text-background shadow-lg',
          'transition-[opacity,transform] duration-150',
          side === 'top'
            ? 'bottom-[calc(100%+6px)] origin-bottom'
            : 'top-[calc(100%+6px)] origin-top',
          open
            ? 'translate-y-0 opacity-100'
            : side === 'top'
              ? 'translate-y-0.5 opacity-0'
              : '-translate-y-0.5 opacity-0',
          contentClassName,
        )}
      >
        {label}
      </span>
    </span>
  );
}

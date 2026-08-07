'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SoftTipProps {
  label: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  side?: 'top' | 'bottom';
}

/** CSS-only tip: hover/focus on pointer devices, native title fallback on touch. */
export function SoftTip({
  label,
  children,
  className,
  contentClassName,
  side = 'top',
}: SoftTipProps) {
  return (
    <span
      className={cn('group/tip relative inline-flex max-w-full', className)}
      title={label}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-60 hidden w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2',
          'rounded-md border border-border/70 bg-foreground px-2 py-1 text-[11px] font-medium leading-snug text-background shadow-lg',
          'opacity-0 transition-[opacity,transform] duration-150',
          '[@media(hover:hover)]:block',
          'group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
          side === 'top'
            ? 'bottom-[calc(100%+6px)] origin-bottom translate-y-0.5 group-hover/tip:translate-y-0 group-focus-within/tip:translate-y-0'
            : 'top-[calc(100%+6px)] origin-top -translate-y-0.5 group-hover/tip:translate-y-0 group-focus-within/tip:translate-y-0',
          contentClassName,
        )}
      >
        {label}
      </span>
    </span>
  );
}

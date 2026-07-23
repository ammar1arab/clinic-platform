'use client';

import { useIsMutating } from '@tanstack/react-query';
import { LoadingDots } from './brand-mark';
import { cn } from '@/lib/utils';

/**
 * Floating activity pill for write operations only. Background refetches
 * intentionally stay silent so opening and filtering pages never flickers.
 */
export function GlobalActivity() {
  const mutating = useIsMutating();
  const active = mutating > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-250 flex justify-center px-4 sm:bottom-6 sm:justify-end sm:pr-6">
      <div
        className={cn(
          'pointer-events-auto relative flex items-center gap-2.5 overflow-hidden rounded-full border border-primary/20 bg-card/95 px-3.5 py-2 text-xs font-medium text-foreground shadow-lg shadow-primary/10 backdrop-blur-md transition-all duration-200',
          active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
        role="status"
        aria-live="polite"
      >
        <span className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-primary via-accent-teal to-warning" />
        <LoadingDots />
        <span>Saving changes</span>
      </div>
    </div>
  );
}

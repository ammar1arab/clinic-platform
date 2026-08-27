'use client';

import { Spinner } from './spinner';
import { cn } from '@/lib/utils';
import { IconService } from '@/constants/icons';

export function PageLoadingState({
  title = 'Loading Clinic Data…',
  description = 'Please wait while we prepare your dashboard',
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border bg-card/60 p-8 text-center shadow-xs backdrop-blur-xs animate-in fade-in-0 duration-300',
        className
      )}
    >
      <div className="relative mb-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5 animate-pulse">
          <IconService className="size-6 text-primary animate-bounce duration-1000" />
        </div>
        <div className="absolute -bottom-1 -right-1">
          <Spinner size="sm" />
        </div>
      </div>
      <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function InlineLoading({
  text = 'Loading…',
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground font-medium', className)}>
      <Spinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

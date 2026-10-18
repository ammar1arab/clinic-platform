'use client';

import { IconLock } from '@/constants/icons';
import { cn } from '@/lib/utils';

export function ReadOnlyMark({
  label,
  size = 'sm',
}: {
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'grid shrink-0 place-items-center rounded-full',
        size === 'md'
          ? 'size-8 border border-primary/15 bg-primary/5 text-primary'
          : 'size-6 bg-background text-muted-foreground shadow-sm ring-1 ring-border/70',
      )}
    >
      <IconLock className={size === 'md' ? 'size-3.5' : 'size-3'} aria-hidden />
    </span>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { IconSpinner } from '@/constants/icons';

export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <IconSpinner
      className={cn('mr-1.5 size-4 animate-spin text-current', className)}
      aria-hidden
    />
  );
}

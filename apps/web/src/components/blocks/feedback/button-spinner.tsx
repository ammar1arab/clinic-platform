'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('mr-1.5 size-4 animate-spin text-current', className)}
      aria-hidden
    />
  );
}

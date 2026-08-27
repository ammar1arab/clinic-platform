'use client';

import { cn } from '@/lib/utils';
import { SoftTip } from './soft-tip';

type Props = {
  children: string;
  className?: string;
  title?: string;
  lines?: 1 | 2 | 3;
};

export function TruncatedText({
  children,
  className,
  title,
  lines = 1,
}: Props) {
  return (
    <SoftTip label={title ?? children}>
      <span
        className={cn(
          'block min-w-0 max-w-full break-words',
          lines === 1 ? 'truncate' : lines === 2 ? 'line-clamp-2' : 'line-clamp-3',
          className,
        )}
      >
        {children}
      </span>
    </SoftTip>
  );
}

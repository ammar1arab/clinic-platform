'use client';

import { isValidElement, type ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';

export function SoftTip({
  label,
  children,
  className,
  contentClassName,
  side = 'top',
  sideOffset,
}: {
  label?: string | null;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}) {
  const text = label?.trim();
  if (!text) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isValidElement(children) ? (
          children
        ) : (
          <span className={cn('inline-flex min-w-0 max-w-full', className)}>
            {children}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset} className={contentClassName}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

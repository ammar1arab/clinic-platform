'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { useMediaQuery } from '@/hooks/shared/use-media-query';
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
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
  const text = label?.trim();
  if (!text) return children;
  const inner = isValidElement(children)
    ? cloneElement(children as ReactElement<{ title?: string }>, { title: undefined })
    : children;

  return (
    <Tooltip
      delayDuration={220}
      disableHoverableContent
      open={canHover ? undefined : false}
    >
      <TooltipTrigger asChild>
        <span className={cn('inline-flex min-w-0 max-w-full touch-manipulation', className)}>
          {inner}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset} className={contentClassName}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

'use client';

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
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

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ title?: string; className?: string }>, {
        title: undefined,
        className: cn((children.props as { className?: string }).className, className),
      })
    : (
        <span className={className}>{children}</span>
      );

  return (
    <Tooltip delayDuration={220} disableHoverableContent>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset} className={contentClassName}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function TooltipProvider({
  delayDuration = 200,
  skipDelayDuration = 120,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TipCursor() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="tip-cursor">
      <path d="M1.4 1.25 2.2 13.7l3.55-3.4 2.7 5.85 2.15-1-2.7-5.85h4.75L1.4 1.25Z" />
    </svg>
  );
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 6,
  align = 'start',
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        side={side}
        sideOffset={sideOffset}
        align={align}
        avoidCollisions
        collisionPadding={10}
        className={cn(
          'overlay-pop overlay-pop-tip z-150 border-0 bg-transparent p-0 shadow-none outline-none',
          className,
        )}
        {...props}
      >
        <span className="tip-cursor-cluster">
          <TipCursor />
          <span className="tip-cursor-label">{children}</span>
        </span>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

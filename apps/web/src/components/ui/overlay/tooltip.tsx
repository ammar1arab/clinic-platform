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

function TipSwoosh({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      width={40}
      height={18}
      viewBox="0 0 40 18"
      className={cn('tip-bubble-swoosh', className)}
      aria-hidden
      {...props}
    >
      <g className="tip-bubble-swoosh-inner">
        <path
          className="tip-bubble-swoosh-fill"
          d="M3.2.4c8.2.2 11.4 6.4 16.8 17.2C25.4 6.8 28.6.6 36.8.4 26.2 4.6 23.4.8 20 .8 16.6.8 13.8 4.6 3.2.4Z"
        />
        <path
          className="tip-bubble-swoosh-wire"
          d="M11.5 2.2c3.4 3.8 5.6 8.4 8.5 14.6"
        />
        <circle className="tip-bubble-spark" cx="20" cy="16.2" r="1.45" />
      </g>
    </svg>
  );
}

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 10,
  align = 'center',
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
          'overlay-pop overlay-pop-tip z-150 overflow-visible border-0 bg-transparent p-0 shadow-none outline-none',
          className,
        )}
        {...props}
      >
        <span className="tip-bubble-body">{children}</span>
        <TooltipPrimitive.Arrow asChild>
          <TipSwoosh />
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

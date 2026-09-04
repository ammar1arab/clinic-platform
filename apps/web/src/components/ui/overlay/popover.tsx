"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import {
  OVERLAY_COLLISION_PADDING,
  OVERLAY_POP_CLASS,
  overlayPointerProps,
} from "@/lib/overlay"

function Popover({
  modal = false,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" modal={modal} {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  avoidCollisions = true,
  collisionPadding = OVERLAY_COLLISION_PADDING,
  onPointerDownOutside,
  onInteractOutside,
  ref,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        side={side}
        sideOffset={sideOffset}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        className={cn(
          OVERLAY_POP_CLASS,
          "z-100 w-[min(100vw-1.5rem,18rem)] max-h-(--radix-popover-content-available-height) max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain p-4 text-sm",
          className,
        )}
        {...props}
        {...overlayPointerProps({ onPointerDownOutside, onInteractOutside })}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }

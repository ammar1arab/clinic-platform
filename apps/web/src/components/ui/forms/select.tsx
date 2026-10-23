"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive, Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import {
  OVERLAY_COLLISION_PADDING,
  OVERLAY_POP_CLASS,
  overlayDismissProps,
} from "@/lib/overlay"
import { IconCheck, IconChevronDown, IconChevronUp } from '@/constants/icons'

type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root> & {
  asChips?: boolean
}

type ChipItem = { value: string; label: React.ReactNode; disabled?: boolean }

const MAX_CHIP_OPTIONS = 12

function collect(children: React.ReactNode, items: ChipItem[], trigger: { current?: Record<string, unknown> }) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode; value?: string; disabled?: boolean }>(child)) return
    if (child.type === SelectItem) {
      items.push({ value: String(child.props.value), label: child.props.children, disabled: child.props.disabled })
      return
    }
    if (child.type === SelectTrigger) trigger.current = child.props as Record<string, unknown>
    collect(child.props.children, items, trigger)
  })
}

function Select({ asChips = false, children, value, onValueChange, disabled, ...props }: SelectProps) {
  const [localValue, setLocalValue] = React.useState(props.defaultValue)
  const selected = value ?? localValue
  const items: ChipItem[] = []
  const trigger: { current?: Record<string, unknown> } = {}
  if (asChips && props.open === undefined && !props.onOpenChange) collect(children, items, trigger)
  if (!items.length || items.length > MAX_CHIP_OPTIONS) {
    return (
      <SelectPrimitive.Root data-slot="select" value={value} onValueChange={onValueChange} disabled={disabled} {...props}>
        {children}
      </SelectPrimitive.Root>
    )
  }
  return (
    <RadioGroupPrimitive.Root
      value={selected}
      onValueChange={(next) => { if (value === undefined) setLocalValue(next); onValueChange?.(next) }}
      name={props.name}
      required={props.required}
      disabled={disabled}
      dir={props.dir}
      id={trigger.current?.id as string | undefined}
      aria-label={trigger.current?.["aria-label"] as string | undefined}
      aria-invalid={trigger.current?.["aria-invalid"] as boolean | undefined}
      data-slot="select"
      className="flex flex-wrap gap-1.5"
    >
      {items.map((item) => (
        <RadioGroupPrimitive.Item key={item.value} value={item.value} disabled={disabled || item.disabled} asChild>
        <Button
          type="button"
          size="sm"
          variant={selected === item.value ? "default" : "outline"}
          disabled={disabled || item.disabled}
          className="max-w-full"
        >
          <span className="truncate">{item.label}</span>
        </Button>
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  chevron = true,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
  chevron?: boolean
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex h-auto min-h-8 w-full min-w-0 cursor-pointer items-center justify-between gap-1.5 overflow-hidden rounded-lg border border-input bg-transparent py-1.5 pe-2 ps-2.5 text-control transition-colors outline-none select-none hover:bg-muted/50 focus-visible:border-primary focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-0 data-placeholder:text-muted-foreground data-[size=default]:min-h-8 data-[size=sm]:min-h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:truncate *:data-[slot=select-value]:whitespace-nowrap *:data-[slot=select-value]:text-start",
        className
      )}
      {...props}
    >
      {children}
      {chevron && (
        <SelectPrimitive.Icon asChild>
          <IconChevronDown className="pointer-events-none size-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  side = "bottom",
  avoidCollisions = true,
  collisionPadding = OVERLAY_COLLISION_PADDING,
  onPointerDownOutside,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          OVERLAY_POP_CLASS,
          "picker-scroll relative z-100 max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) min-w-[min(18rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)]",
          className,
        )}
        position={position}
        align={align}
        side={side}
        avoidCollisions={avoidCollisions}
        collisionPadding={collisionPadding}
        {...props}
        {...overlayDismissProps({ onPointerDownOutside, preventOwnTrigger: false })}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "w-full p-1",
            position === "popper" && "min-w-(--radix-select-trigger-width)",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full min-w-0 cursor-pointer items-start gap-1.5 rounded-md py-1.5 pe-8 ps-1.5 text-control outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:min-w-0 *:[span]:last:flex-1 *:[span]:last:break-words *:[span]:last:whitespace-normal",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <IconCheck className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <IconChevronUp
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <IconChevronDown
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

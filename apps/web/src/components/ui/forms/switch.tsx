"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
        "data-[state=checked]:bg-primary",
        "data-[state=unchecked]:bg-muted-foreground/30 hover:data-[state=unchecked]:bg-muted-foreground/40 dark:data-[state=unchecked]:bg-muted-foreground/35 dark:hover:data-[state=unchecked]:bg-muted-foreground/45",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-xs ring-0 transition-transform dark:bg-zinc-100",
          "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",
          "data-[state=checked]:translate-x-4 rtl:data-[state=checked]:-translate-x-4",
          "data-[state=unchecked]:translate-x-0 rtl:data-[state=unchecked]:translate-x-0",
          "group-data-[size=sm]/switch:data-[state=checked]:translate-x-3 rtl:group-data-[size=sm]/switch:data-[state=checked]:-translate-x-3",
          "group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-0 rtl:group-data-[size=sm]/switch:data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex min-h-5 w-fit max-w-full shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-start shadow-xs transition-[color,background-color,border-color,box-shadow,transform] [&>span:not([class*='rounded-full'])]:truncate focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [a]:hover:-translate-y-px has-[>span.rounded-full:first-child]:ps-1.5 has-[>span.rounded-full:last-child]:pe-1.5 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary text-primary-foreground shadow-primary/15 [a]:hover:bg-primary/90",
        secondary:
          "border-border/80 bg-secondary text-secondary-foreground [a]:hover:bg-secondary/75",
        destructive:
          "border-destructive/25 bg-destructive/10 text-destructive shadow-none focus-visible:ring-destructive/20 [a]:hover:bg-destructive/15",
        outline:
          "border-border/90 bg-background/70 text-foreground [a]:hover:bg-muted",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "border-success/25 bg-success/10 text-success shadow-none",
        warning:
          "border-warning/25 bg-warning/10 text-warning shadow-none",
        info:
          "border-info/25 bg-info/10 text-info shadow-none",
        teal:
          "border-accent-teal/25 bg-accent-teal/10 text-accent-teal shadow-none",
        violet:
          "border-accent-violet/25 bg-accent-violet/10 text-accent-violet shadow-none",
        cyan:
          "border-accent-cyan/25 bg-accent-cyan/10 text-accent-cyan shadow-none",
        muted:
          "border-border/80 bg-muted/80 text-muted-foreground",
        fill:
          "w-full max-w-none justify-center rounded-lg bg-muted px-3 py-2 shadow-none max-lg:w-fit",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>
export { Badge, badgeVariants }

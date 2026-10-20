'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
        className,
      )}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center justify-center text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
  {
    variants: {
      variant: {
        default: 'h-10 rounded-lg bg-muted/70 p-1',
        document: 'grid h-auto w-full grid-cols-3 gap-1.5 bg-transparent p-0 sm:gap-3',
        pill: 'h-8 rounded-full bg-muted/60 p-1 sm:h-9',
        line: 'h-11 gap-1 rounded-none border-b border-border bg-transparent p-0',
        fill: 'grid h-12 w-full grid-cols-[repeat(auto-fit,minmax(0,1fr))] rounded-xl bg-muted/70 p-1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pe-1 has-data-[icon=inline-start]:ps-1 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=document]/tabs-list:h-auto group-data-[variant=document]/tabs-list:min-w-0 group-data-[variant=document]/tabs-list:flex-col group-data-[variant=document]/tabs-list:items-center group-data-[variant=document]/tabs-list:text-center group-data-[variant=document]/tabs-list:gap-1 group-data-[variant=document]/tabs-list:rounded-lg group-data-[variant=document]/tabs-list:border-border/60 group-data-[variant=document]/tabs-list:bg-muted/20 group-data-[variant=document]/tabs-list:px-3 group-data-[variant=document]/tabs-list:py-2.5 group-data-[variant=document]/tabs-list:text-xs sm:group-data-[variant=document]/tabs-list:text-sm group-data-[variant=document]/tabs-list:data-[state=active]:border-primary/50 group-data-[variant=document]/tabs-list:data-[state=active]:bg-card group-data-[variant=document]/tabs-list:data-[state=active]:text-primary dark:group-data-[variant=document]/tabs-list:data-[state=active]:bg-card dark:group-data-[variant=document]/tabs-list:data-[state=active]:border-primary/50',
        'group-data-[variant=pill]/tabs-list:rounded-full group-data-[variant=pill]/tabs-list:px-2.5 group-data-[variant=pill]/tabs-list:text-xs sm:group-data-[variant=pill]/tabs-list:px-4 sm:group-data-[variant=pill]/tabs-list:text-sm',
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
        'data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground',
        'after:absolute after:bg-primary after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-0 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-end-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 text-sm outline-none', className)}
      {...props}
    />
  );
}

function TabsSteps({ steps, className }: { steps: { value: string; label: string }[]; className?: string }) {
  return (
    <TabsList variant="line" className={cn('w-full shrink-0 justify-start', className)}>
      {steps.map((step) => (
        <TabsTrigger key={step.value} value={step.value}>
          {step.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsSteps, tabsListVariants };

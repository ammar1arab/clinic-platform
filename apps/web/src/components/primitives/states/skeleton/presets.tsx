'use client';

import { Card, CardContent, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

export function StatGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-xs"
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 6,
  cols = 5,
  hasHeader = true,
  className,
}: {
  rows?: number;
  cols?: number;
  hasHeader?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden shadow-xs',
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between border-b bg-muted/30 p-3.5 gap-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex items-center justify-between p-3.5 gap-4"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="size-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-xs">
                <Skeleton className="h-3.5 w-[85%]" />
                <Skeleton className="h-2.5 w-[50%]" />
              </div>
            </div>
            {Array.from({ length: cols - 2 }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 w-20 hidden md:block" />
            ))}
            <Skeleton className="h-6 w-16 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IconCardSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl bg-card px-4 py-3.5 md:border"
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  className,
}: {
  count?: number;
  columns?: string;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-4', columns, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <Skeleton className="size-9 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>

          <div className="space-y-2 py-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({
  fields = 6,
  cols = 2,
  hasActions = true,
  className,
}: {
  fields?: number;
  cols?: 1 | 2 | 3;
  hasActions?: boolean;
  className?: string;
}) {
  const colClass =
    cols === 1
      ? 'grid-cols-1'
      : cols === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : 'grid-cols-1 md:grid-cols-2';

  return (
    <div
      className={cn('card-aura space-y-5 rounded-xl bg-card p-5', className)}
    >
      <div className="space-y-1.5 border-b pb-3.5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72" />
      </div>

      <div className={cn('grid gap-4', colClass)}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {hasActions && (
        <div className="flex items-center justify-end gap-2.5 border-t pt-4">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      )}
    </div>
  );
}

export function FormPageSkeleton({
  sections = [1, 4, 3, 4],
  className,
}: {
  sections?: number[];
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {sections.map((fields, i) => (
        <FormSkeleton
          key={i}
          fields={fields}
          cols={fields >= 3 ? 2 : 1}
          hasActions={i === sections.length - 1}
        />
      ))}
    </div>
  );
}

export function NoteTemplateBuilderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('page-fill gap-2', className)} aria-busy="true">
      <div className="flex shrink-0 items-center justify-between"><Skeleton className="h-8 w-16" /><Skeleton className="h-5 w-16 rounded-full" /></div>
      <div className="flex h-11 shrink-0 items-center gap-6 border-b border-border/60">{[0, 1, 2].map((step) => <Skeleton key={step} className="h-4 w-24" />)}</div>
      <div className="space-y-4 p-1">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-28" />
          <div className="grid gap-4 xl:grid-cols-2">{[0, 1].map((field) => <div key={field} className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-full rounded-lg" /></div>)}</div>
          <div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="size-6 rounded-full" /></div>
        </div>
        <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-lg" /><Skeleton className="h-8 w-20 rounded-lg" /></div>
      </div>
    </div>
  );
}

export function TimelineSkeleton({
  hours = 8,
  columns = 3,
  className,
}: {
  hours?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card shadow-xs overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/20 p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-5 w-32 ms-2" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="grid grid-cols-[76px_repeat(3,1fr)] divide-x divide-y border-t">
        <div className="p-2 bg-muted/30" />
        {Array.from({ length: columns }).map((_, c) => (
          <div key={c} className="p-3 bg-card flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
        ))}

        {Array.from({ length: hours }).map((_, h) => (
          <div key={h} className="contents">
            <div className="p-2 h-24 flex items-start justify-end">
              <Skeleton className="h-3 w-10" />
            </div>
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className="p-2 h-24 bg-background/50 space-y-1.5">
                {(h + c) % 2 === 0 && (
                  <div className="rounded-lg border bg-card p-2 space-y-1 shadow-2xs">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({
  hasActions = true,
  className,
}: {
  hasActions?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 mb-4',
        className,
      )}
    >
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      {hasActions && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}

export function QueueColumnSkeleton({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border-2 bg-card p-3 shadow-xs sm:p-3.5">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1"><Skeleton className="h-4 w-28 max-w-full" /><Skeleton className="h-3 w-20" /></div>
            <Skeleton className="size-7 shrink-0 rounded-full" />
          </div>
          <div className="mb-2.5 space-y-1"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/3" /></div>
          <div className="flex justify-between gap-2"><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
          <Skeleton className="mt-3 h-7 w-full rounded-lg" />
        </div>
      ))}
    </>
  );
}

export function VisitWorkspaceSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Card className="gap-0 py-0">
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3"><Skeleton className="size-10 shrink-0 rounded-full" /><div className="min-w-0 space-y-2"><Skeleton className="h-7 w-40 max-w-full" /><Skeleton className="h-4 w-56 max-w-full" /></div></div>
            <div className="flex gap-2"><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
          </div>
          <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div key={item} className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-28 max-w-full" /></div>)}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-16 w-full rounded-lg" />)}
      </div>
      <Card className="gap-0 py-0"><CardContent className="space-y-4 p-3 sm:p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  );
}

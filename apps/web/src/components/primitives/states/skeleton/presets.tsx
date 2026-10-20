'use client';

import { Card, CardContent, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

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

export const NOTE_TEMPLATE_GRID = 'grid grid-cols-1 gap-2 min-[26rem]:grid-cols-2 sm:gap-3 lg:grid-cols-3';

export function NoteTemplateCardSkeleton() {
  return (
    <Card className="card-aura gap-0 py-0">
      <CardContent className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3.5">
        <Skeleton className="size-9 shrink-0 rounded-xl sm:size-10" />
        <Skeleton className="h-4 min-w-0 flex-1" />
        <Skeleton className="h-5 w-16 shrink-0 rounded-full max-sm:hidden" />
        <Skeleton className="size-7 shrink-0 rounded-lg" />
        <Skeleton className="size-8 shrink-0 rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function NoteTemplateBuilderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('page-fill gap-2', className)} aria-busy="true">
      <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="hidden h-9 w-72 justify-self-center rounded-full md:block" />
        <div className="flex items-center justify-end gap-1 justify-self-end sm:gap-2">
          <Skeleton className="h-8 w-44 rounded-full" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-12 w-full shrink-0 rounded-xl md:hidden" />
      <div className="min-h-0 flex-1 space-y-4 overflow-hidden p-1">
        <Card className="overflow-visible">
          <CardContent className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((field) => (
                <div key={field} className="space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-full rounded-lg" /></div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-44 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TimelineSkeleton({ hours = 14, className }: { hours?: number; className?: string }) {
  return (
    <div className={cn('page-fill card-aura relative overflow-hidden rounded-xl border bg-card p-2 sm:p-2.5', className)} role="status" aria-busy="true">
      <div className="mb-2 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-3">
        <div className="flex items-center gap-0.5">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
        <Skeleton className="hidden h-4 w-36 sm:block" />
        <div className="flex items-center justify-end gap-1 max-sm:col-start-3 sm:gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border/60">
        {Array.from({ length: hours }).map((_, hour) => (
          <div key={hour} className="relative flex h-20 border-t border-border/30 first:border-t-0">
            <div className="flex w-12 shrink-0 items-start justify-end border-e pe-1.5 pt-1"><Skeleton className="h-2.5 w-7" /></div>
            <div className="relative flex-1 px-2 py-1.5">
              {hour % 3 === 1 ? (
                <div className="w-[85%] max-w-md space-y-1.5 rounded-lg border bg-muted/30 p-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QueueColumnSkeleton({ count = 6 }: { count?: number }) {
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
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-center gap-3"><Skeleton className="size-10 shrink-0 rounded-full" /><div className="min-w-0 space-y-2"><Skeleton className="h-7 w-40 max-w-full" /><Skeleton className="h-4 w-56 max-w-full" /></div></div>
            <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:gap-2"><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
          </div>
          <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 lg:grid-cols-3 xl:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="space-y-1"><Skeleton className="h-4 w-16" /><Skeleton className="h-6 w-28 max-w-full" /></div>)}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-0 py-0"><CardContent className="space-y-4 p-3 sm:p-4"><Skeleton className="h-4 w-32" /><Skeleton className="h-32 w-full" /></CardContent></Card>
    </div>
  );
}

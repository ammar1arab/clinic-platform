'use client';

import { Skeleton } from '@/components/ui';
import { useLanguage } from '@/providers';

export function CalendarSkeleton() {
  const { t } = useLanguage();

  return (
    <div
      className="card-aura page-fill rounded-xl border bg-card p-2 sm:p-2.5"
      role="status"
      aria-label={t.appointments.calendarLoading}
    >
      <div className="mb-2 grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="order-3 col-span-2 h-9 w-full rounded-lg sm:order-none sm:col-span-1 sm:w-48" />
        <div className="flex min-w-0 items-center justify-end gap-1">
          <Skeleton className="h-4 w-28 max-w-full" />
          <Skeleton className="size-7 shrink-0 rounded-md" />
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[2rem_repeat(6,minmax(0,1fr))] gap-px overflow-hidden rounded-lg border border-border/60 bg-border/40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-8 rounded-none" />
        ))}
        {Array.from({ length: 42 }).map((_, i) => (
          <div key={i} className="min-h-0 space-y-2 overflow-hidden bg-card p-1 sm:p-2">
            <Skeleton className="h-4 w-6" />
            {i % 3 === 0 && <Skeleton className="h-4 w-full rounded-md" />}
            {i % 5 === 0 && <Skeleton className="h-4 w-[80%] rounded-md" />}
          </div>
        ))}
      </div>
    </div>
  );
}

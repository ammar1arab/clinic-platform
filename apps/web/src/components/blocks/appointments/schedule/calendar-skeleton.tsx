'use client';

import { Skeleton } from '@/components/ui';
import { useLanguage } from '@/providers';

export function CalendarSkeleton() {
  const { t } = useLanguage();

  return (
    <div
      className="page-fill card-aura rounded-xl border bg-card p-2 sm:p-2.5"
      role="status"
      aria-label={t.appointments.calendarLoading}
    >
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
        <Skeleton className="h-6 w-36 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[auto_repeat(5,minmax(5.5rem,1fr))] gap-px overflow-hidden rounded-lg border border-border/60 bg-border/40 max-md:grid-rows-[auto_repeat(5,minmax(4.5rem,auto))]">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-8 rounded-none" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-0 space-y-2 bg-card p-2">
            <Skeleton className="h-4 w-6" />
            {i % 3 === 0 && <Skeleton className="h-4 w-full rounded-md" />}
            {i % 5 === 0 && <Skeleton className="h-4 w-[80%] rounded-md" />}
          </div>
        ))}
      </div>
    </div>
  );
}

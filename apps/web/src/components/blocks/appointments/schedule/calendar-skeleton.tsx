'use client';

import { Skeleton } from '@/components/ui';
import { useLanguage } from '@/providers';

export function CalendarSkeleton() {
  const { t } = useLanguage();

  return (
    <div
      className="card-aura rounded-xl bg-card p-2 sm:p-3 lg:p-4"
      role="status"
      aria-label={t.appointments.calendarLoading}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-8 rounded-none" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-22 space-y-2 bg-card p-2">
            <Skeleton className="h-4 w-6" />
            {i % 3 === 0 && <Skeleton className="h-4 w-full rounded-md" />}
            {i % 5 === 0 && <Skeleton className="h-4 w-[80%] rounded-md" />}
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { Skeleton } from '@/components/ui';
import { useLanguage } from '@/providers';
import { cn } from '@/lib/utils';
import type { ScheduleView } from './schedule-nav';

export function CalendarSkeleton({ view = 'month', focused = false }: { view?: ScheduleView; focused?: boolean }) {
  const { t } = useLanguage();
  const month = view === 'month';
  const columns = view === 'day' ? 1 : 7;
  const tracks = columns + (month ? 0 : 1);
  const rows = month ? 6 : 8;

  return (
    <div
      className={cn('page-fill h-0 flex-1 min-h-0 overflow-hidden bg-card card-aura rounded-xl border', focused ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5')}
      role="status"
      aria-label={t.appointments.calendarLoading}
    >
      <div className="mb-2 flex shrink-0 items-center gap-1 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
        <div className="flex min-w-0 items-center gap-1 sm:contents">
          <div className="flex items-center gap-0.5">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="size-6 rounded-md" />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            {[0, 1, 2].map((item) => <Skeleton key={item} className="h-6 w-9 rounded-full sm:w-14" />)}
          </div>
        </div>
        <div className="ms-auto flex min-w-0 items-center justify-end gap-1 sm:ms-0 sm:gap-2">
          <Skeleton className="h-4 w-28 min-w-0" />
          <Skeleton className="size-6 shrink-0 rounded-md" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/40" style={{ gridTemplateColumns: `${month ? '' : '2.5rem '}repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `auto repeat(${rows}, minmax(0, 1fr))` }}>
        {Array.from({ length: tracks }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-8 rounded-none" />
        ))}
        {Array.from({ length: tracks * rows }).map((_, i) => (
          <div key={i} className="min-h-0 space-y-2 overflow-hidden bg-card p-1 sm:p-2">
            <Skeleton className="h-3 w-5 max-w-full" />
            {i % 3 === 0 && <Skeleton className="h-4 w-full rounded-md" />}
            {i % 5 === 0 && <Skeleton className="h-4 w-[80%] rounded-md" />}
          </div>
        ))}
      </div>
    </div>
  );
}

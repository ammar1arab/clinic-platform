import {
  PageHeaderSkeleton,
  StatGridSkeleton,
  TableSkeleton,
} from '@/components/primitives';
import { Skeleton } from '@/components/ui';
import { ClinicLockup } from '@/components/layout/clinic-identity';

export function DashboardMainFallback() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatGridSkeleton count={4} />
      <TableSkeleton rows={6} />
    </div>
  );
}

export function DashboardShellFallback() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background" aria-busy>
      <aside
        data-app-sidebar=""
        className="hidden w-56 shrink-0 flex-col border-e border-border/80 bg-card/95 md:flex lg:w-64 [[data-sidebar=collapsed]_&]:w-18 [[data-sidebar=collapsed]_&]:lg:w-18"
        aria-hidden
      >
        <div className="flex h-app-header items-center px-4 [[data-sidebar=collapsed]_&]:justify-center [[data-sidebar=collapsed]_&]:px-2">
          <ClinicLockup />
        </div>
        <div className="flex flex-1 flex-col gap-2 px-2.5 py-3 [[data-sidebar=collapsed]_&]:px-2">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 [[data-sidebar=collapsed]_&]:justify-center [[data-sidebar=collapsed]_&]:px-0"
            >
              <Skeleton className="size-4 shrink-0 [[data-sidebar=collapsed]_&]:size-5" />
              <Skeleton className="h-3.5 flex-1 [[data-sidebar=collapsed]_&]:hidden" />
            </div>
          ))}
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <div className="flex h-app-header shrink-0 items-center border-b border-border/70 px-3 md:px-5" aria-hidden>
          <ClinicLockup />
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-app-main-pad py-app-main-pad-y">
          <div data-page-scroll className="page-scroll">
            <DashboardMainFallback />
          </div>
        </main>
      </div>
    </div>
  );
}

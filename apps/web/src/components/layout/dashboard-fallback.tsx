import {
  PageHeaderSkeleton,
  StatGridSkeleton,
  TableSkeleton,
} from '@/components/primitives';

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
        className="hidden w-56 shrink-0 border-e border-border/80 bg-card/95 md:block lg:w-64"
        aria-hidden
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <div className="h-14 shrink-0 border-b border-border/70" aria-hidden />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-app-main-pad py-app-main-pad-y">
          <div data-page-scroll className="page-scroll">
            <DashboardMainFallback />
          </div>
        </main>
      </div>
    </div>
  );
}

import { FormSkeleton, PageHeaderSkeleton } from '@/components/primitives/skeleton-presets';

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <FormSkeleton fields={6} cols={2} />
    </div>
  );
}

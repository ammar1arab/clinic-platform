import { FormSkeleton, PageHeaderSkeleton } from '@/components/primitives';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <FormSkeleton fields={6} cols={2} />
    </div>
  );
}

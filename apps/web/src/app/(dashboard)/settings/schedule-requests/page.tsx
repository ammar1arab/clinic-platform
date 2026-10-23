import { ScheduleRequestsPage } from '@/components/blocks/practitioners/schedule-requests';

export default async function Page({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { doctorId, view } = await searchParams;
  return <ScheduleRequestsPage doctorId={typeof doctorId === 'string' ? doctorId : undefined} initialGroup={view === 'history' || view === 'pending' ? view : 'all'} />;
}

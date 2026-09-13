import { PractitionerDetailView } from './practitioner-detail-view';

export default async function PractitionerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PractitionerDetailView id={id} />;
}

import { PractitionerHoursView } from './practitioner-hours-view';

export default async function PractitionerHoursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PractitionerHoursView id={id} />;
}

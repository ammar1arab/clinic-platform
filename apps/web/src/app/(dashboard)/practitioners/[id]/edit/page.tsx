import { EditPractitionerView } from './edit-practitioner-view';

export default async function EditPractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditPractitionerView id={id} />;
}

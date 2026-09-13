import { EditAppointmentView } from './edit-appointment-view';

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditAppointmentView id={id} />;
}

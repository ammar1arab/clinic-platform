import { PatientProfile } from '@/components/blocks/patients';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientProfile patientId={id} />;
}

'use client';

import { use } from 'react';
import { PatientProfile } from '@/components/blocks/patients';

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <PatientProfile patientId={id} />;
}

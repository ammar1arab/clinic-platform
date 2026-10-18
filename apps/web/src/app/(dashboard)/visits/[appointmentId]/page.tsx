'use client';

import { useParams } from 'next/navigation';
import { VisitWorkspace } from '@/components/blocks/visits/visit-workspace';

export default function VisitPage() {
  const params = useParams<{ appointmentId: string }>();
  return <VisitWorkspace appointmentId={params.appointmentId} />;
}

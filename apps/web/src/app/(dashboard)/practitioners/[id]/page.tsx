'use client';

import { use } from 'react';
import {
  EmptyState,
  SectionLoader,
} from '@/components/primitives';
import { PractitionerProfile } from '@/components/blocks/practitioners';
import { IconPractitioner } from '@/constants/icons';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePractitioner } from '@/hooks/api/use-practitioners';

export default function PractitionerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const { data: practitioner, isLoading } = usePractitioner(id);

  if (isLoading) return <SectionLoader label="Loading practitioner…" />;
  if (!practitioner) {
    return (
      <EmptyState
        icon={IconPractitioner}
        title="Practitioner not found"
        description="This record may have been removed."
      />
    );
  }

  return <PractitionerProfile practitioner={practitioner} clinicId={clinicId} />;
}

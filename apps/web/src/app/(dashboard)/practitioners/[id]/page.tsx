'use client';

import { use } from 'react';
import { EmptyState } from '@/components/primitives/empty-state';
import { SectionLoader } from '@/components/primitives/spinner';
import { PractitionerProfile } from '@/components/blocks/practitioners/practitioner-profile';
import { IconPractitioner } from '@/constants/icons';
import { useClinicId } from '@/hooks/use-clinic-id';
import { usePractitioner } from '@/hooks/use-practitioners';

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

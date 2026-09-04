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
import { useLanguage } from '@/providers';

export default function PractitionerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { data: practitioner, isLoading } = usePractitioner(id);

  if (isLoading) return <SectionLoader label={t?.practitioner?.loadingPractitioner ?? 'Loading practitioner…'} />;
  if (!practitioner) {
    return (
      <EmptyState
        icon={IconPractitioner}
        title={t?.practitioner?.practitionerNotFound ?? 'Practitioner not found'}
        description={t?.practitioner?.practitionerNotFoundDesc ?? 'This record may have been removed.'}
      />
    );
  }

  return <PractitionerProfile practitioner={practitioner} clinicId={clinicId} />;
}

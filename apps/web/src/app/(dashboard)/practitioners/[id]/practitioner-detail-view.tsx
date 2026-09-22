'use client';

import {
  EmptyState,
  FormPageSkeleton,
} from '@/components/primitives';
import { PractitionerProfile } from '@/components/blocks/practitioners';
import { IconPractitioner } from '@/constants/icons';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePractitioner } from '@/hooks/api/use-practitioners';
import { useLanguage } from '@/providers';

export function PractitionerDetailView({ id }: { id: string }) {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { data: practitioner, isLoading } = usePractitioner(id);

  if (isLoading) return <FormPageSkeleton />;
  if (!practitioner) {
    return (
      <EmptyState
        icon={IconPractitioner}
        title={t.practitioner.practitionerNotFound}
        description={t.practitioner.practitionerNotFoundDesc}
      />
    );
  }

  return <PractitionerProfile practitioner={practitioner} clinicId={clinicId} />;
}

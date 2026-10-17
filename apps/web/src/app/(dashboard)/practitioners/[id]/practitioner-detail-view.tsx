'use client';

import {
  EmptyState,
  ErrorState,
  FormPageSkeleton,
} from '@/components/primitives';
import { PractitionerProfile } from '@/components/blocks/practitioners';
import { IconPractitioner } from '@/constants/icons';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePractitioner } from '@/hooks/api/use-practitioners';
import { useAuth, useLanguage } from '@/providers';
import { ROLE } from '@clinic/types';

export function PractitionerDetailView({ id }: { id: string }) {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPractitioner = user?.role === ROLE.PRACTITIONER;
  const practitionerId = isPractitioner ? user.clinicUserId : id;
  const { data: practitioner, isLoading, isError, refetch } = usePractitioner(practitionerId);
  const canManage = !isPractitioner;

  if (isLoading) return <FormPageSkeleton />;
  if (isError) return <ErrorState onRetry={() => void refetch()} />;
  if (!practitioner) {
    return (
      <EmptyState
        icon={IconPractitioner}
        title={t.practitioner.practitionerNotFound}
        description={t.practitioner.practitionerNotFoundDesc}
      />
    );
  }

  return <PractitionerProfile practitioner={practitioner} clinicId={clinicId} canManage={canManage} />;
}

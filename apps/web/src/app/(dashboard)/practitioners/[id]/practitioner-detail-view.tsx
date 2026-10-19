'use client';

import {
  EmptyState,
  ErrorState,
  FormPageSkeleton,
  PageBack,
} from '@/components/primitives';
import { PractitionerProfile } from '@/components/blocks/practitioners';
import { IconPractitioner } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
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
  const backHref = isPractitioner ? ROUTES.DASHBOARD : ROUTES.PRACTITIONERS;

  if (isLoading) {
    return (
      <div className="page-stack space-y-4">
        <PageBack backHref={backHref} />
        <FormPageSkeleton sections={[1, 6, 4]} />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="page-stack space-y-4">
        <PageBack backHref={backHref} />
        <ErrorState onRetry={() => void refetch()} />
      </div>
    );
  }
  if (!practitioner) {
    return (
      <div className="page-stack space-y-4">
        <PageBack backHref={backHref} />
        <EmptyState
          icon={IconPractitioner}
          title={t.practitioner.practitionerNotFound}
          description={t.practitioner.practitionerNotFoundDesc}
        />
      </div>
    );
  }

  return <PractitionerProfile practitioner={practitioner} clinicId={clinicId} canManage={canManage} />;
}

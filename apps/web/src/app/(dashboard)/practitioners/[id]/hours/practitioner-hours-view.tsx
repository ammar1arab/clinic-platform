'use client';

import { useRouter } from 'next/navigation';
import { EmptyState, FormPageSkeleton, PageBack, RowActionsMenu } from '@/components/primitives';
import { PractitionerHoursForm } from '@/components/blocks/practitioners/practitioner-hours-form';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { usePractitioner } from '@/hooks/api/use-practitioners';
import { ROUTES } from '@/constants/routes';
import { IconEdit, IconPractitioner, IconView } from '@/constants/icons';
import { useLanguage } from '@/providers';

export function PractitionerHoursView({ id }: { id: string }) {
  const clinicId = useClinicId();
  const router = useRouter();
  const { t } = useLanguage();
  const { data, isLoading, isError } = usePractitioner(id);

  return (
    <div className="page-stack space-y-4">
      <PageBack
        backHref={ROUTES.PRACTITIONER_DETAIL(id)}
        backLabel={t.practitioner.backToProfile}
        actions={
          <RowActionsMenu
            items={[
              {
                label: t.practitioner.view,
                icon: IconView,
                href: ROUTES.PRACTITIONER_DETAIL(id),
              },
              {
                label: t.practitioner.edit,
                icon: IconEdit,
                href: ROUTES.PRACTITIONERS_EDIT(id),
              },
            ]}
          />
        }
      />
      <h1 className="font-heading text-lg font-semibold">{t.practitioner.workingHours}</h1>
      {isLoading ? (
        <FormPageSkeleton sections={[2, 2, 2]} />
      ) : isError || !data ? (
        <EmptyState
          icon={IconPractitioner}
          title={t.practitioner.notFound}
          description={t.practitioner.notFoundDesc}
        />
      ) : (
        <PractitionerHoursForm
          clinicId={clinicId}
          practitioner={data}
          onCancel={() => router.push(ROUTES.PRACTITIONER_DETAIL(id))}
          onSuccess={() => router.push(ROUTES.PRACTITIONER_DETAIL(id))}
        />
      )}
    </div>
  );
}

'use client';

import { PractitionerForm } from '@/components/blocks/practitioners';
import { use } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import {
  PageBack,
  EmptyState,
  RowActionsMenu,
} from '@/components/primitives';

import { useClinicId } from '@/hooks/shared/use-clinic-id';
import {
  useDeletePractitioner,
  useDeactivatePractitioner,
  usePractitioner,
  useReactivatePractitioner,
} from '@/hooks/api/use-practitioners';
import { ROUTES } from '@/constants/routes';
import { getStaffName } from '@/i18n';
import { IconActivate, IconDeactivate, IconDelete, IconPractitioner, IconView } from '@/constants/icons';
import { useLanguage } from '@/providers';

export default function EditPractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { data, isLoading, isError } = usePractitioner(id);
  const deactivate = useDeactivatePractitioner(clinicId);
  const reactivate = useReactivatePractitioner(clinicId);
  const remove = useDeletePractitioner(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();
  const toggling = deactivate.isPending || reactivate.isPending;
  const titleName = data ? getStaffName(data, lang) : '';

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack
        backHref={ROUTES.PRACTITIONER_DETAIL(id)}
        backLabel={t.practitioner.backToProfile}
        actions={
          data ? (
            <RowActionsMenu
              items={[
                {
                  label: t.practitioner.view,
                  icon: IconView,
                  href: ROUTES.PRACTITIONER_DETAIL(id),
                },
                {
                  label: data.isActive ? t.practitioner.deactivate : t.practitioner.reactivate,
                  icon: data.isActive ? IconDeactivate : IconActivate,
                  disabled: toggling,
                  onSelect: () =>
                    data.isActive
                      ? deactivate.mutate(data.id)
                      : reactivate.mutate(data.id),
                },
                {
                  label: t.practitioner.delete,
                  icon: IconDelete,
                  variant: 'destructive',
                  onSelect: () => del.ask({ id: data.id, name: titleName }),
                },
              ]}
            />
          ) : null
        }
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : isError || !data ? (
        <EmptyState
          icon={IconPractitioner}
          title={t.practitioner.notFound}
          description={t.practitioner.notFoundDesc}
        />
      ) : (
        <PractitionerForm
          clinicId={clinicId}
          practitioner={data}
          onCancel={() => router.push(ROUTES.PRACTITIONER_DETAIL(id))}
          onSuccess={(savedId) => router.push(ROUTES.PRACTITIONER_DETAIL(savedId))}
        />
      )}

      <TwoStepDeleteDialogs
        step1={del.step1}
        step2={del.step2}
        onStep1OpenChange={(open) => !open && del.cancelStep1()}
        onStep2OpenChange={(open) => !open && del.cancelStep2()}
        onContinue={del.advance}
        onConfirm={() => {
          if (!del.step2) return;
          remove.mutate(del.step2.id, {
            onSuccess: () => {
              del.clear();
              router.push(ROUTES.PRACTITIONERS);
            },
          });
        }}
        isPending={remove.isPending}
        warning={t.practitioner.deleteWarning1}
        finalWarning={t.practitioner.deleteWarning2}
        confirmLabel={t.practitioner.deleteConfirm}
      />
    </div>
  );
}

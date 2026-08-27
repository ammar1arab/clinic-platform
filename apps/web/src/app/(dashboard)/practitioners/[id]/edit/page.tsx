'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import {
  PageBack,
  EmptyState,
  RowActionsMenu,
} from '@/components/primitives';
import { PractitionerForm } from '@/components/blocks/practitioners';
import {
  TwoStepDeleteDialogs,
  useTwoStepDelete,
} from '@/components/blocks/feedback';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import {
  useDeletePractitioner,
  useDeactivatePractitioner,
  usePractitioner,
  useReactivatePractitioner,
} from '@/hooks/api/use-practitioners';
import { ROUTES } from '@/constants/routes';
import { IconActivate, IconDeactivate, IconDelete, IconPractitioner, IconView } from '@/constants/icons';

export default function EditPractitionerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const router = useRouter();
  const { data, isLoading, isError } = usePractitioner(id);
  const deactivate = useDeactivatePractitioner(clinicId);
  const reactivate = useReactivatePractitioner(clinicId);
  const remove = useDeletePractitioner(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();
  const toggling = deactivate.isPending || reactivate.isPending;
  const titleName = data
    ? data.title
      ? `${data.title} ${data.name}`
      : data.name
    : '';

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack
        backHref={ROUTES.PRACTITIONER_DETAIL(id)}
        backLabel="Back to profile"
        actions={
          data ? (
            <RowActionsMenu
              items={[
                {
                  label: 'View',
                  icon: IconView,
                  href: ROUTES.PRACTITIONER_DETAIL(id),
                },
                {
                  label: data.isActive ? 'Deactivate' : 'Reactivate',
                  icon: data.isActive ? IconDeactivate : IconActivate,
                  disabled: toggling,
                  onSelect: () =>
                    data.isActive
                      ? deactivate.mutate(data.id)
                      : reactivate.mutate(data.id),
                },
                {
                  label: 'Delete',
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
          title="Practitioner not found"
          description="This practitioner may have been removed."
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
        warning="This permanently removes the practitioner, their schedule, and their appointments. This cannot be undone. To just hide them, use Deactivate instead."
        finalWarning="This permanently deletes the practitioner and every appointment assigned to them. This action cannot be undone."
        confirmLabel="Yes, delete practitioner"
      />
    </div>
  );
}

'use client';

import { AccountPasswordReset } from '@/components/blocks/auth/account-password-reset';

import { PractitionerForm } from '@/components/blocks/practitioners';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { useRouter } from 'next/navigation';
import {
  PageBack,
  EmptyState,
  FormPageSkeleton,
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
import { IconActivate, IconCalendar, IconDeactivate, IconDelete, IconPractitioner, IconView } from '@/constants/icons';
import { useLanguage } from '@/providers';

export function EditPractitionerView({ id }: { id: string }) {
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
    <div className="page-stack space-y-4">
      <PageBack
        backHref={ROUTES.PRACTITIONER_DETAIL(id)}
        actions={
          <RowActionsMenu
            items={[
              {
                label: t.practitioner.view,
                icon: IconView,
                href: ROUTES.PRACTITIONER_DETAIL(id),
              },
              {
                label: t.practitioner.workingHours,
                icon: IconCalendar,
                href: ROUTES.PRACTITIONER_HOURS(id),
              },
              ...(data
                ? [
                    {
                      label: data.isActive
                        ? t.practitioner.deactivate
                        : t.practitioner.reactivate,
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
                      variant: 'destructive' as const,
                      onSelect: () => del.ask({ id: data.id, name: titleName }),
                    },
                  ]
                : []),
            ]}
          />
        }
      />
      {isLoading ? (
        <FormPageSkeleton />
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

      {data && !isError && <AccountPasswordReset id={id} />}

      <TwoStepDeleteDialogs
        controller={del}
        onConfirm={(item) => remove.mutate(item.id, {
          onSuccess: () => {
            del.clear();
            router.push(ROUTES.PRACTITIONERS);
          },
        })}
        isPending={remove.isPending}
        warning={t.practitioner.deleteWarning1}
        finalWarning={t.practitioner.deleteWarning2}
        confirmLabel={t.practitioner.deleteConfirm}
      />
    </div>
  );
}

'use client';

import { use } from 'react';
import { TwoStepDeleteDialogs, useTwoStepDelete } from '@/components/primitives';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import { PatientForm } from '@/components/blocks/patients';
import {
  PageBack,
  RowActionsMenu,
} from '@/components/primitives';

import { usePatient, useDeletePatient, useTogglePatientStatus } from '@/hooks/api/use-patients';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { getPersonName } from '@/i18n';
import { IconActivate, IconDeactivate, IconDelete, IconView } from '@/constants/icons';
import { useLanguage } from '@/providers';

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { data: patient, isLoading } = usePatient(id);
  const deleteMutation = useDeletePatient(clinicId);
  const toggleStatus = useTogglePatientStatus(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const fullName = patient ? getPersonName(patient, lang) : '';

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack
        backHref={`/patients/${id}`}
        backLabel={t.patient.backToPatient}
        actions={
          patient ? (
            <RowActionsMenu
              items={[
                { label: t.common.view, icon: IconView, href: `/patients/${id}` },
                {
                  label: patient.isActive ? t.common.deactivate : t.common.reactivate,
                  icon: patient.isActive ? IconDeactivate : IconActivate,
                  disabled: toggleStatus.isPending,
                  onSelect: () =>
                    toggleStatus.mutate({
                      id: patient.id,
                      isActive: !patient.isActive,
                    }),
                },
                {
                  label: t.common.delete,
                  icon: IconDelete,
                  variant: 'destructive',
                  onSelect: () => del.ask({ id: patient.id, name: fullName }),
                },
              ]}
            />
          ) : null
        }
      />

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && !patient && (
        <p className="text-sm text-muted-foreground">{t.patient.notFound}</p>
      )}

      {patient && (
        <PatientForm
          clinicId={clinicId}
          patient={patient}
          onCancel={() => router.push(`/patients/${id}`)}
          onSuccess={(pid) => router.push(`/patients/${pid}`)}
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
          deleteMutation.mutate(del.step2.id, {
            onSuccess: () => {
              del.clear();
              router.push('/patients');
            },
          });
        }}
        isPending={deleteMutation.isPending}
        warning={t.patient.deleteWarning1}
        finalWarning={t.patient.deleteWarning2}
        confirmLabel={t.patient.deleteConfirm}
      />
    </div>
  );
}

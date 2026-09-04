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
import { IconActivate, IconDeactivate, IconDelete, IconView } from '@/constants/icons';

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(id);
  const deleteMutation = useDeletePatient(clinicId);
  const toggleStatus = useTogglePatientStatus(clinicId);
  const del = useTwoStepDelete<{ id: string; name: string }>();

  const fullName = patient
    ? `${patient.firstNameEn} ${patient.lastNameEn}`.trim()
    : '';

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack
        backHref={`/patients/${id}`}
        backLabel="Back to Patient"
        actions={
          patient ? (
            <RowActionsMenu
              items={[
                { label: 'View', icon: IconView, href: `/patients/${id}` },
                {
                  label: patient.isActive ? 'Deactivate' : 'Reactivate',
                  icon: patient.isActive ? IconDeactivate : IconActivate,
                  disabled: toggleStatus.isPending,
                  onSelect: () =>
                    toggleStatus.mutate({
                      id: patient.id,
                      isActive: !patient.isActive,
                    }),
                },
                {
                  label: 'Delete',
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
        <p className="text-sm text-muted-foreground">Patient not found</p>
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
        warning="This permanently removes the patient and their visit history. This cannot be undone. To just hide the patient, use Deactivate instead."
        finalWarning="This permanently deletes the patient and every appointment linked to them."
        confirmLabel="Yes, delete patient"
      />
    </div>
  );
}

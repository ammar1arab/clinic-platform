'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { PatientForm } from '@/components/blocks/patients/patient-form';
import { PageBack } from '@/components/primitives/page-back';
import { usePatient } from '@/hooks/use-patients';
import { useClinicId } from '@/hooks/use-clinic-id';

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const clinicId = useClinicId();
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageBack backHref={`/patients/${id}`} backLabel="Back to Patient" />

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
    </div>
  );
}

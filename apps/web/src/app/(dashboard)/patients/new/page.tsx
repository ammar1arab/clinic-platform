'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PatientForm } from '@/components/blocks/patients';
import { PageBack } from '@/components/primitives';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { ROUTES } from '@/constants/routes';
import { resolveReturnTo } from '@/components/blocks/appointments';
import { useLanguage } from '@/providers';

function NewPatientInner() {
  const clinicId = useClinicId();
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLanguage();

  const returnTo = resolveReturnTo(params.get('returnTo'), ROUTES.PATIENTS);
  const fromSchedule = returnTo.startsWith(ROUTES.SCHEDULE);
  const backHref = returnTo;
  const backLabel = fromSchedule ? t.appointments.backToSchedule : t.patient.backToPatients;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack backHref={backHref} backLabel={backLabel} />

      <PatientForm
        clinicId={clinicId}
        onCancel={() => router.push(returnTo)}
        onSuccess={(id) =>
          router.push(fromSchedule ? returnTo : ROUTES.PATIENT_DETAIL(id))
        }
      />
    </div>
  );
}

export default function NewPatientPage() {
  return (
    <Suspense fallback={null}>
      <NewPatientInner />
    </Suspense>
  );
}

'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppointmentForm,
  parseScheduleView,
  schedulePath,
} from '@/components/blocks/appointments';
import { PageBack, FormPageSkeleton } from '@/components/primitives';
import { useAuth, useLanguage } from '@/providers';

function NewAppointmentInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();

  const defaultDate = params.get('date') ?? '';
  const defaultTime = params.get('time') ?? '';
  const defaultDoctorId = params.get('doctorId') ?? user?.clinicUserId ?? '';
  const backHref = schedulePath(parseScheduleView(params.get('view')));

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack backHref={backHref} backLabel={t.appointments.backToSchedule} />

      <AppointmentForm
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        currentDoctorId={defaultDoctorId}
        currentDoctorName={user?.name ?? t.appointments.doctor}
        onCancel={() => router.push(backHref)}
        onSuccess={() => router.push(backHref)}
      />
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<FormPageSkeleton />}>
      <NewAppointmentInner />
    </Suspense>
  );
}

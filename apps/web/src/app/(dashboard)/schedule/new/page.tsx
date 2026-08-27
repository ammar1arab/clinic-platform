'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppointmentForm,
  parseScheduleView,
  schedulePath,
} from '@/components/blocks/appointments';
import { PageBack, FormPageSkeleton } from '@/components/primitives';
import { useAuth } from '@/providers';

function NewAppointmentInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const defaultDate = params.get('date') ?? '';
  const defaultTime = params.get('time') ?? '';
  const defaultDoctorId = params.get('doctorId') ?? user?.clinicUserId ?? '';
  const backHref = schedulePath(parseScheduleView(params.get('view')));

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <PageBack backHref={backHref} backLabel="Back to Schedule" />

      <AppointmentForm
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        currentDoctorId={defaultDoctorId}
        currentDoctorName={user?.name ?? 'Doctor'}
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

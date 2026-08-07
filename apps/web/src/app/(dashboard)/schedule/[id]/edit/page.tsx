'use client';

import { Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentForm } from '@/components/blocks/appointments/appointment-form';
import { PageBack } from '@/components/primitives/page-back';
import { useAppointment } from '@/hooks/use-appointments';
import { useAuth } from '@/providers';
import {
  parseScheduleView,
  schedulePath,
} from '@/components/blocks/appointments/schedule-nav';

function EditAppointmentInner({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const { data: appointment, isLoading } = useAppointment(id);
  const backHref = schedulePath(parseScheduleView(params.get('view')));

  const doctorName = appointment?.doctor?.name ?? user?.name ?? 'You';

  return (
    <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
      <PageBack backHref={backHref} backLabel="Back to Schedule" />

      {isLoading || !appointment ? (
        <div className="space-y-3 sm:space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <AppointmentForm
          appointment={appointment}
          currentDoctorId={appointment.doctorId}
          currentDoctorName={doctorName}
          onCancel={() => router.push(backHref)}
          onSuccess={() => router.push(backHref)}
        />
      )}
    </div>
  );
}

export default function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense fallback={null}>
      <EditAppointmentInner id={id} />
    </Suspense>
  );
}

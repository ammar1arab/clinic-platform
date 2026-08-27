'use client';

import { Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import {
  AppointmentForm,
  parseScheduleView,
  schedulePath,
} from '@/components/blocks/appointments';
import {
  PageBack,
  RowActionsMenu,
} from '@/components/primitives';
import { useAppointment, useUpdateAppointment } from '@/hooks/api/use-appointments';
import { useAuth, useConfirm } from '@/providers';
import { IconBan } from '@/constants/icons';

function EditAppointmentInner({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { data: appointment, isLoading } = useAppointment(id);
  const update = useUpdateAppointment();
  const backHref = schedulePath(parseScheduleView(params.get('view')));

  const doctorName = appointment?.doctor?.name ?? user?.name ?? 'You';
  const canCancel =
    appointment &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'completed';

  return (
    <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
      <PageBack
        backHref={backHref}
        backLabel="Back to Schedule"
        actions={
          canCancel ? (
            <RowActionsMenu
              items={[
                {
                  label: 'Cancel appointment',
                  icon: IconBan,
                  variant: 'destructive',
                  disabled: update.isPending,
                  onSelect: async () => {
                    const ok = await confirm({
                      title: 'Cancel this appointment?',
                      description: 'The slot will be released and the visit marked cancelled.',
                      confirmLabel: 'Cancel appointment',
                      variant: 'destructive',
                    });
                    if (!ok) return;
                    update.mutate(
                      { id, data: { status: 'cancelled' } },
                      { onSuccess: () => router.push(backHref) },
                    );
                  },
                },
              ]}
            />
          ) : null
        }
      />

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

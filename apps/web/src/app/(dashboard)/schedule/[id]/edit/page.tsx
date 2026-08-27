'use client';

import { Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppointmentForm,
  parseScheduleView,
  schedulePath,
} from '@/components/blocks/appointments';
import {
  EmptyState,
  FormPageSkeleton,
  PageBack,
  RowActionsMenu,
} from '@/components/primitives';
import { Button } from '@/components/ui';
import { useAppointment, useUpdateAppointment } from '@/hooks/api/use-appointments';
import { useAuth, useConfirm } from '@/providers';
import { IconBan, IconVisit } from '@/constants/icons';

function EditAppointmentInner({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { data: appointment, isLoading, isError } = useAppointment(id);
  const update = useUpdateAppointment();
  const backHref = schedulePath(parseScheduleView(params.get('view')));

  const doctorName = appointment?.doctor?.name ?? user?.name ?? 'You';
  const canCancel =
    appointment &&
    appointment.status !== 'cancelled' &&
    appointment.status !== 'completed';

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
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

      {isLoading ? (
        <FormPageSkeleton />
      ) : isError || !appointment ? (
        <EmptyState
          icon={IconVisit}
          title="Appointment not found"
          description="This visit may have been removed or the link is out of date."
          action={
            <Button variant="outline" size="sm" onClick={() => router.push(backHref)}>
              Back to Schedule
            </Button>
          }
        />
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
    <Suspense fallback={<FormPageSkeleton />}>
      <EditAppointmentInner id={id} />
    </Suspense>
  );
}

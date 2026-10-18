'use client';

import { WaitingQueueBoard } from '@/components/blocks/appointments/schedule/waiting-queue-board';
import { useAppointments } from '@/hooks/api/use-appointments';
import { useClinicRealtime } from '@/hooks/api/use-clinic-realtime';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { ErrorState } from '@/components/primitives';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { ROLE } from '@clinic/types';
import { todayAppointmentRange } from '@/lib/datetime';

export default function PractitionerQueuePage() {
  const { user } = useAuth();
  const router = useRouter();
  const clinicId = useClinicId();
  const dayRange = todayAppointmentRange();
  useClinicRealtime(clinicId);
  const appointments = useAppointments(
    {
      ...dayRange,
      doctorId: user?.role === ROLE.PRACTITIONER ? user.clinicUserId : undefined,
    },
    !!user,
  );

  if (appointments.isError && !appointments.data) {
    return <ErrorState onRetry={() => void appointments.refetch()} className="page-fill" />;
  }

  return (
    <div className="page-fill">
      <WaitingQueueBoard
        appointments={appointments.data}
        isLoading={appointments.isLoading}
        canManagePayments={false}
        onEventClick={(appointment) => router.push(`${ROUTES.SCHEDULE_EDIT(appointment.id)}?view=queue`)}
      />
    </div>
  );
}

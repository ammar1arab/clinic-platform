'use client';

import { WaitingQueueBoard } from '@/components/blocks/appointments/schedule/waiting-queue-board';
import { useAppointments } from '@/hooks/api/use-appointments';
import { useAuth } from '@/providers';
import { ROLE } from '@clinic/types';

export default function PractitionerQueuePage() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const appointments = useAppointments(
    {
      startDate: today,
      endDate: today,
      doctorId: user?.role === ROLE.PRACTITIONER ? user.clinicUserId : undefined,
    },
    !!user,
  );

  return (
    <div className="page-fill">
      <WaitingQueueBoard appointments={appointments.data} isLoading={appointments.isLoading} onEventClick={() => undefined} />
    </div>
  );
}

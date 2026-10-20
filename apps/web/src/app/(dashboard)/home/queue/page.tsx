'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ScheduleToolbar,
  ViewFocus,
  matchesAppointmentSearch,
} from '@/components/blocks/appointments';
import { WaitingQueueBoard } from '@/components/blocks/appointments/schedule/waiting-queue-board';
import { useAppointments } from '@/hooks/api/use-appointments';
import type { AppointmentStatus } from '@/services/appointments.service';
import { useClinicRealtime } from '@/hooks/api/use-clinic-realtime';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useDepartments } from '@/hooks/api/use-departments';
import { ErrorState } from '@/components/primitives';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import { useAuth, useLanguage } from '@/providers';
import { ROLE } from '@clinic/types';
import { todayAppointmentRange } from '@/lib/datetime';

export default function PractitionerQueuePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const clinicId = useClinicId();
  const dayRange = todayAppointmentRange();
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<AppointmentStatus>>(() => new Set());
  const [pickerSlot, setPickerSlot] = useState<HTMLDivElement | null>(null);
  useClinicRealtime(clinicId);
  const { data: departments } = useDepartments(clinicId);
  const appointments = useAppointments(
    {
      ...dayRange,
      departmentId: departmentId || undefined,
      doctorId: user?.role === ROLE.PRACTITIONER ? user.clinicUserId : undefined,
    },
    !!user,
  );

  const toggleStatus = useCallback((status: AppointmentStatus) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const filtered = useMemo(
    () =>
      appointments.data
        ?.filter((appt) => statusFilters.size === 0 || statusFilters.has(appt.status))
        .filter((appt) => matchesAppointmentSearch(appt, search)),
    [appointments.data, search, statusFilters],
  );

  if (appointments.isError && !appointments.data) {
    return <ErrorState onRetry={() => void appointments.refetch()} className="page-fill" />;
  }

  return (
    <div className="page-fill gap-2.5">
      <div className="shrink-0">
        <ScheduleToolbar
          view="queue"
          search={search}
          onSearchChange={setSearch}
          departmentId={departmentId}
          onDepartmentChange={setDepartmentId}
          departments={departments}
          statusFilters={statusFilters}
          onToggleStatus={toggleStatus}
          onClearStatuses={() => setStatusFilters(new Set())}
          pickerSlotRef={setPickerSlot}
        />
      </div>
      <ViewFocus label={t.queue.waitingQueue}>
        {(focused) => (
          <WaitingQueueBoard
            appointments={filtered}
            isLoading={appointments.isLoading}
            focused={focused}
            toolbarSlot={pickerSlot}
            canManagePayments={false}
            onEventClick={(appointment) => router.push(`${ROUTES.SCHEDULE_EDIT(appointment.id)}?view=queue`)}
          />
        )}
      </ViewFocus>
    </div>
  );
}

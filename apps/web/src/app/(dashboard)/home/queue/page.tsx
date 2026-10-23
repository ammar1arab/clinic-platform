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
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';

export default function PractitionerQueuePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const clinicId = useClinicId();
  const dayRange = todayAppointmentRange();
  const [search, setSearch] = useSessionStorageState(`${clinicId || 'none'}:practitioner-queue-search`, '');
  const [departmentId, setDepartmentId] = useSessionStorageState(`${clinicId || 'none'}:practitioner-queue-department`, '');
  const [statusFilters, setStatusFilters] = useSessionStorageState<AppointmentStatus[]>(`${clinicId || 'none'}:practitioner-queue-status`, []);
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
      return prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status];
    });
  }, [setStatusFilters]);

  const filtered = useMemo(
    () =>
      appointments.data
        ?.filter((appt) => statusFilters.length === 0 || statusFilters.includes(appt.status))
        .filter((appt) => matchesAppointmentSearch(appt, search)),
    [appointments.data, search, statusFilters],
  );

  if (appointments.isError && !appointments.data) {
    return <ErrorState onRetry={() => void appointments.refetch()} className="page-fill" />;
  }

  const toolbar = (
    <ScheduleToolbar
      view="queue"
      search={search}
      onSearchChange={setSearch}
      departmentId={departmentId}
      onDepartmentChange={setDepartmentId}
      departments={departments}
      statusFilters={new Set(statusFilters)}
      onToggleStatus={toggleStatus}
      onClearStatuses={() => setStatusFilters([])}
      pickerSlotRef={setPickerSlot}
    />
  );

  return (
    <div className="page-fill-always">
      <ViewFocus label={t.queue.waitingQueue} storageKey={`${clinicId || 'none'}:practitioner-queue`}>
        {(focused) => (
          <>
            {toolbar}
            <WaitingQueueBoard
              appointments={filtered}
              isLoading={appointments.isLoading}
              focused={focused}
              toolbarSlot={pickerSlot}
              canManagePayments={false}
              onEventClick={(appointment) => router.push(`${ROUTES.SCHEDULE_EDIT(appointment.id)}?view=queue`)}
            />
          </>
        )}
      </ViewFocus>
    </div>
  );
}

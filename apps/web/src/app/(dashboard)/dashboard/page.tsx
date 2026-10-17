'use client';

import {
  useDashboardKpis,
  useRoomUtilization,
  useDashboardRealtime,
} from '@/hooks/api/use-dashboard';
import {
  KpiCardBlock,
  RoomUtilizationCardBlock,
} from '@/components/blocks/dashboard';
import { ViewFocus } from '@/components/blocks/appointments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { formatWaitingMins } from '@/lib/waiting-time';
import { IconCheckCircle, IconHourglass, IconRoom, IconTime, IconTimer, IconTodaysAppointments } from '@/constants/icons';
import { useLanguage } from '@/providers';
import { useAuth } from '@/providers';
import { ROLE } from '@clinic/types';
import { EmptyState, ErrorState } from '@/components/primitives';

export default function DashboardPage() {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { user } = useAuth();
  const practitionerId = user?.role === ROLE.PRACTITIONER ? user.clinicUserId : undefined;

  const { data: kpis, isLoading: kpisLoading, isError: kpisError, refetch: refetchKpis } = useDashboardKpis(clinicId, practitionerId, !!user);
  const { data: rooms, isLoading: roomsLoading, isError: roomsError, refetch: refetchRooms } = useRoomUtilization(clinicId, practitionerId, !!user);

  useDashboardRealtime(clinicId, {
    notifyOnAppointmentChange: true,
  });

  return (
    <div className="page-fill gap-5">
      <div
        data-focus-hide=""
        className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4 xl:grid-cols-6"
      >
        <KpiCardBlock
          label={t?.dashboard?.todaysAppointments}
          value={kpis?.total ?? 0}
          icon={IconTodaysAppointments}
          accent="default"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label={t?.dashboard?.waiting}
          value={kpis?.waitingCount ?? 0}
          icon={IconTimer}
          accent="warning"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label={t?.dashboard?.inProgress}
          value={kpis?.inProgress ?? 0}
          icon={IconTime}
          accent="teal"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label={t?.dashboard?.completed}
          value={kpis?.completed ?? 0}
          icon={IconCheckCircle}
          accent="success"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label={t?.dashboard?.avgWait}
          value={formatWaitingMins(kpis?.avgWaitingMins, t)}
          icon={IconHourglass}
          accent="error"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label={t?.dashboard?.rooms}
          value={kpis?.roomCount ?? 0}
          icon={IconRoom}
          accent="muted"
          isLoading={kpisLoading}
        />
      </div>

      {kpisError || roomsError ? (
        <ErrorState onRetry={() => { void refetchKpis(); void refetchRooms(); }} className="page-fill" />
      ) : !kpisLoading && !roomsLoading && kpis?.total === 0 && rooms?.length === 0 ? (
        <EmptyState
          icon={IconTodaysAppointments}
          title={t.appointments.noAppointments}
          description={t.appointments.noAppointmentsDesc}
          className="page-fill"
        />
      ) : <ViewFocus label={t.dashboard.roomUtilizationToday}>
        {(focused) => (
          <RoomUtilizationCardBlock
            rooms={rooms}
            isLoading={roomsLoading}
            focused={focused}
          />
        )}
      </ViewFocus>}
    </div>
  );
}

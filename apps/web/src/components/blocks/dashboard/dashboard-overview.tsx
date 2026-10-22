'use client';

import { useDashboardKpis, useRoomUtilization, useDashboardRealtime } from '@/hooks/api/use-dashboard';
import { KpiCardBlock } from './kpi-card';
import { RoomUtilizationCardBlock } from './room-utilization-card';
import { ViewFocus } from '@/components/blocks/appointments';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { formatWaitingMins } from '@/lib/waiting-time';
import { IconCheckCircle, IconHourglass, IconRoom, IconTime, IconTimer, IconTodaysAppointments } from '@/constants/icons';
import { useAuth, useLanguage } from '@/providers';
import { ROLE } from '@clinic/types';
import { EmptyState, ErrorState } from '@/components/primitives';

export function DashboardOverview() {
  const clinicId = useClinicId();
  const { t } = useLanguage();
  const { user } = useAuth();
  const practitionerId = user?.role === ROLE.PRACTITIONER ? user.clinicUserId : undefined;
  const kpis = useDashboardKpis(clinicId, practitionerId, !!user);
  const rooms = useRoomUtilization(clinicId, practitionerId, !!user);

  useDashboardRealtime(clinicId, { notifyOnAppointmentChange: true });

  const retry = () => {
    void kpis.refetch();
    void rooms.refetch();
  };

  return (
    <div className="page-fill gap-2.5">
      <div data-focus-hide="" className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCardBlock label={t.dashboard.todaysAppointments} value={kpis.data?.total ?? 0} icon={IconTodaysAppointments} accent="default" isLoading={kpis.isLoading} />
        <KpiCardBlock label={t.dashboard.waiting} value={kpis.data?.waitingCount ?? 0} icon={IconTimer} accent="warning" isLoading={kpis.isLoading} />
        <KpiCardBlock label={t.dashboard.inProgress} value={kpis.data?.inProgress ?? 0} icon={IconTime} accent="teal" isLoading={kpis.isLoading} />
        <KpiCardBlock label={t.dashboard.completed} value={kpis.data?.completed ?? 0} icon={IconCheckCircle} accent="success" isLoading={kpis.isLoading} />
        <KpiCardBlock label={t.dashboard.avgWait} value={formatWaitingMins(kpis.data?.avgWaitingMins, t)} icon={IconHourglass} accent="error" isLoading={kpis.isLoading} />
        <KpiCardBlock label={t.dashboard.rooms} value={kpis.data?.roomCount ?? 0} icon={IconRoom} accent="muted" isLoading={kpis.isLoading} />
      </div>

      {kpis.isError || rooms.isError ? (
        <ErrorState onRetry={retry} className="page-fill" />
      ) : !kpis.isLoading && !rooms.isLoading && kpis.data?.total === 0 && rooms.data?.length === 0 ? (
        <EmptyState icon={IconTodaysAppointments} title={t.appointments.noAppointments} description={t.appointments.noAppointmentsDesc} className="page-fill" />
      ) : (
        <ViewFocus label={t.dashboard.roomUtilizationToday} storageKey={`${clinicId || 'none'}:dashboard-room-utilization`}>
          {(focused) => <RoomUtilizationCardBlock rooms={rooms.data} isLoading={rooms.isLoading} focused={focused} />}
        </ViewFocus>
      )}
    </div>
  );
}

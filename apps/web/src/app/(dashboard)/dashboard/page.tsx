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
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { formatWaitingMins } from '@/lib/waiting-time';
import { IconCheckCircle, IconHourglass, IconRoom, IconTime, IconTimer, IconTodaysAppointments } from '@/constants/icons';
import { useLanguage } from '@/providers';

export default function DashboardPage() {
  const clinicId = useClinicId();
  const { t } = useLanguage();

  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis(clinicId);
  const { data: rooms, isLoading: roomsLoading } = useRoomUtilization(clinicId);

  useDashboardRealtime(clinicId, {
    notifyOnAppointmentChange: true,
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 lg:gap-4">
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
          value={formatWaitingMins(kpis?.avgWaitingMins, false, t)}
          icon={IconHourglass}
          accent="warning"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label={t?.dashboard?.rooms}
          value={kpis?.roomCount ?? 0}
          icon={IconRoom}
          accent="teal"
          isLoading={kpisLoading}
        />
      </div>

      <RoomUtilizationCardBlock rooms={rooms} isLoading={roomsLoading} />
    </div>
  );
}

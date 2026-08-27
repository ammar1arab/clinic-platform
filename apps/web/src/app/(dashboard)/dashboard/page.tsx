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

export default function DashboardPage() {
  const clinicId = useClinicId();

  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis(clinicId);
  const { data: rooms, isLoading: roomsLoading } = useRoomUtilization(clinicId);

  useDashboardRealtime(clinicId, {
    notifyOnAppointmentChange: true,
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6 lg:gap-4">
        <KpiCardBlock
          label="Today's Appointments"
          value={kpis?.total ?? 0}
          icon={IconTodaysAppointments}
          accent="default"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label="Waiting"
          value={kpis?.waitingCount ?? 0}
          icon={IconTimer}
          accent="warning"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label="In Progress"
          value={kpis?.inProgress ?? 0}
          icon={IconTime}
          accent="teal"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label="Completed"
          value={kpis?.completed ?? 0}
          icon={IconCheckCircle}
          accent="success"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label="Avg Wait"
          value={formatWaitingMins(kpis?.avgWaitingMins)}
          icon={IconHourglass}
          accent="warning"
          isLoading={kpisLoading}
        />
        <KpiCardBlock
          label="Rooms"
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

'use client';

import {
  IconRoom,
  IconTime,
  IconTodaysAppointments,
} from '@/constants/icons';
import { CheckCircle2, Hourglass, Timer } from 'lucide-react';
import {
  useDashboardKpis,
  useRoomUtilization,
  useDashboardRealtime,
} from '@/hooks/use-dashboard';
import { KpiCardBlock } from '@/components/blocks/dashboard/kpi-card';
import { RoomUtilizationCardBlock } from '@/components/blocks/dashboard/room-utilization-card';
import { useClinicId } from '@/hooks/use-clinic-id';
import { formatWaitingMins } from '@/lib/waiting-time';

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
          value={kpisLoading ? '—' : (kpis?.total ?? 0)}
          icon={IconTodaysAppointments}
          accent="default"
        />
        <KpiCardBlock
          label="Waiting"
          value={kpisLoading ? '—' : (kpis?.waitingCount ?? 0)}
          icon={Timer}
          accent="warning"
        />
        <KpiCardBlock
          label="In Progress"
          value={kpisLoading ? '—' : (kpis?.inProgress ?? 0)}
          icon={IconTime}
          accent="teal"
        />
        <KpiCardBlock
          label="Completed"
          value={kpisLoading ? '—' : (kpis?.completed ?? 0)}
          icon={CheckCircle2}
          accent="success"
        />
        <KpiCardBlock
          label="Avg Wait"
          value={kpisLoading ? '—' : formatWaitingMins(kpis?.avgWaitingMins)}
          icon={Hourglass}
          accent="warning"
        />
        <KpiCardBlock
          label="Rooms"
          value={kpisLoading ? '—' : (kpis?.roomCount ?? 0)}
          icon={IconRoom}
          accent="teal"
        />
      </div>

      <RoomUtilizationCardBlock rooms={rooms} isLoading={roomsLoading} />
    </div>
  );
}

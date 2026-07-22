'use client';

import {
  IconRoom,
  IconTime,
  IconTodaysAppointments,
} from '@/constants/icons';
import { CheckCircle2 } from 'lucide-react';
import {
  useDashboardKpis,
  useRoomUtilization,
  useDashboardRealtime,
} from '@/hooks/use-dashboard';
import { KpiCardBlock } from '@/components/blocks/dashboard/kpi-card';
import { RoomUtilizationCardBlock } from '@/components/blocks/dashboard/room-utilization-card';
import { useClinicId } from '@/hooks/use-clinic-id';

export default function DashboardPage() {
  const clinicId = useClinicId();

  const { data: kpis, isLoading: kpisLoading, isFetching: kpisFetching } =
    useDashboardKpis(clinicId);
  const { data: rooms, isLoading: roomsLoading, isFetching: roomsFetching } =
    useRoomUtilization(clinicId);

  const { connected } = useDashboardRealtime(clinicId, {
    notifyOnAppointmentChange: true,
  });

  const refreshing = (kpisFetching || roomsFetching) && !kpisLoading && !roomsLoading;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCardBlock
          label="Today's Appointments"
          value={kpisLoading ? '—' : kpis?.total ?? 0}
          icon={IconTodaysAppointments}
        />
        <KpiCardBlock
          label="In Progress"
          value={kpisLoading ? '—' : kpis?.inProgress ?? 0}
          icon={IconTime}
          accent="warning"
        />
        <KpiCardBlock
          label="Completed"
          value={kpisLoading ? '—' : kpis?.completed ?? 0}
          icon={CheckCircle2}
          accent="success"
        />
        <KpiCardBlock
          label="Rooms"
          value={kpisLoading ? '—' : kpis?.roomCount ?? 0}
          icon={IconRoom}
        />
      </div>

      <RoomUtilizationCardBlock rooms={rooms} isLoading={roomsLoading} />
    </div>
  );
}

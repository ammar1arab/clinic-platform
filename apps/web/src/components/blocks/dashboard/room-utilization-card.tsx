'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui';
import { EmptyState } from '@/components/primitives';
import { RoomUtilization } from '@/services/dashboard.service';
import { cn } from '@/lib/utils';
import { IconRoom } from '@/constants/icons';
import { useLanguage } from '@/providers';
import { getBilingualName } from '@/i18n';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useDepartments } from '@/hooks/api/use-departments';
import { useRooms } from '@/hooks/api/use-rooms';

interface Props {
  rooms: RoomUtilization[] | undefined;
  isLoading: boolean;
}

type RoomGroup = {
  key: string;
  label: string;
  rooms: RoomUtilization[];
};

function barColor(percent: number) {
  if (percent >= 80) return 'bg-error';
  if (percent >= 50) return 'bg-warning';
  return 'bg-success';
}

export function RoomUtilizationCardBlock({ rooms, isLoading }: Props) {
  const { t, lang } = useLanguage();
  const clinicId = useClinicId();
  const { data: catalogRooms } = useRooms(clinicId);
  const { data: departments } = useDepartments(clinicId);

  const groups = useMemo(() => {
    if (!rooms?.length) return [];

    const roomDept = new Map(
      (catalogRooms ?? []).map((room) => [room.id, room.departmentId]),
    );
    const deptById = new Map((departments ?? []).map((dept) => [dept.id, dept]));

    const map = new Map<string, RoomGroup>();

    for (const room of rooms) {
      const departmentId = room.departmentId ?? roomDept.get(room.roomId) ?? null;
      const department = departmentId ? deptById.get(departmentId) : undefined;
      const label = department
        ? getBilingualName(department.name, department.nameAr, lang)
        : room.departmentName
          ? getBilingualName(room.departmentName, room.departmentNameAr, lang)
          : t.dashboard.unassignedDepartment;
      const key = departmentId ?? (label || '__unassigned__');

      const existing = map.get(key);
      if (existing) {
        existing.rooms.push(room);
      } else {
        map.set(key, { key, label, rooms: [room] });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const aUnassigned = a.label === t.dashboard.unassignedDepartment;
      const bUnassigned = b.label === t.dashboard.unassignedDepartment;
      if (aUnassigned !== bUnassigned) return aUnassigned ? 1 : -1;
      return a.label.localeCompare(b.label, lang);
    });
  }, [rooms, catalogRooms, departments, lang, t.dashboard.unassignedDepartment]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t.dashboard.roomUtilizationToday}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}

        {!isLoading && rooms?.length === 0 && (
          <EmptyState icon={IconRoom} title={t.settings.noRooms} className="py-6" />
        )}

        {groups.map((group) => (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h3>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {group.rooms.length}
              </span>
            </div>
            <div className="space-y-3">
              {group.rooms.map((room) => {
                const displayName = getBilingualName(room.roomName, room.roomNameAr, lang);
                return (
                  <div key={room.roomId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{displayName}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {room.utilisationPercent}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted/80">
                      <div
                        className={cn(
                          'h-full rounded-full shadow-[0_0_12px_-2px_currentColor] transition-all duration-700 ease-out',
                          barColor(room.utilisationPercent),
                        )}
                        style={{ width: `${Math.min(room.utilisationPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

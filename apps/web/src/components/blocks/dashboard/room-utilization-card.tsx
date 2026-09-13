'use client';

import { useMemo, useState } from 'react';
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
import { IconChevronDown, IconRoom } from '@/constants/icons';
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

const fold =
  'duration-[var(--overlay-duration)] ease-[var(--overlay-ease)] motion-reduce:transition-none';

export function RoomUtilizationCardBlock({ rooms, isLoading }: Props) {
  const { t, lang } = useLanguage();
  const clinicId = useClinicId();
  const { data: catalogRooms } = useRooms(clinicId);
  const { data: departments } = useDepartments(clinicId);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());

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

  const toggle = (key: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Card className="page-fill">
      <CardHeader className="shrink-0">
        <CardTitle className="text-sm">{t.dashboard.roomUtilizationToday}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}

        {!isLoading && rooms?.length === 0 && (
          <EmptyState icon={IconRoom} title={t.settings.noRooms} className="py-6" />
        )}

        {groups.map((group) => {
          const open = !collapsed.has(group.key);
          return (
            <section key={group.key}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={open}
                aria-label={`${open ? t.layout.sidebar.collapse : t.layout.sidebar.expand} ${group.label}`}
                className="flex w-full items-center gap-1.5 border-b border-border/60 pb-1.5 text-start"
              >
                <IconChevronDown
                  aria-hidden
                  className={cn(
                    'size-3 shrink-0 text-muted-foreground/70 transition-transform',
                    fold,
                    !open && '-rotate-90 rtl:rotate-90',
                  )}
                />
                <h3 className="min-w-0 flex-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </h3>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {group.rooms.length}
                </span>
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows]',
                  fold,
                  open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-3 pt-3">
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
                </div>
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

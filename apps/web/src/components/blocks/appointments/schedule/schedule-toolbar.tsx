'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
} from '@/components/ui';
import {
  SearchInput,
  SearchablePicker,
  SoftTip,
  Spinner,
} from '@/components/primitives';
import type { Department } from '@/services/departments.service';
import type { AppointmentStatus } from '@/services/appointments.service';
import type { ScheduleView } from './schedule-nav';
import { FORM_ALL } from '@/constants/form';
import { cn } from '@/lib/utils';
import { IconAdd, IconChevronDown, IconNewPatient, IconPatients, IconSchedule, IconTimer } from '@/constants/icons';
import { STATUS_MENU_CONTENT_CLASS, StatusFilterItems } from '../shared/status-menu';
import { useLanguage } from '@/providers';

const VIEW_TABS: {
  id: 'calendar' | 'doctors' | 'queue';
  icon: typeof IconSchedule;
  match: (view: ScheduleView) => boolean;
  target: (view: ScheduleView) => ScheduleView;
}[] = [
  {
    id: 'calendar',
    icon: IconSchedule,
    match: (v) => v === 'month' || v === 'week' || v === 'day',
    target: (v) => (v === 'month' || v === 'week' || v === 'day' ? v : 'month'),
  },
  {
    id: 'doctors',
    icon: IconPatients,
    match: (v) => v === 'doctors',
    target: () => 'doctors',
  },
  {
    id: 'queue',
    icon: IconTimer,
    match: (v) => v === 'queue',
    target: () => 'queue',
  },
];

interface Props {
  view: ScheduleView;
  onViewChange: (view: ScheduleView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  departments: Department[] | undefined;
  statusFilters: Set<AppointmentStatus>;
  onToggleStatus: (status: AppointmentStatus) => void;
  onClearStatuses: () => void;
  count: number;
  isLoading: boolean;
  onNewPatient: () => void;
  onNewAppointment: () => void;
}

function StatusFilterDropdown({
  active,
  onToggle,
  onClear,
}: {
  active: Set<AppointmentStatus>;
  onToggle: (status: AppointmentStatus) => void;
  onClear: () => void;
}) {
  const { t } = useLanguage();
  const count = active.size;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'h-9 min-w-0 flex-1 gap-1 border-border/70 bg-background/50 px-2.5 font-semibold shadow-2xs sm:flex-none',
            count > 0 && 'border-primary/35 bg-primary/5 text-foreground',
          )}
        >
          <span className="truncate text-muted-foreground">{t.appointments.status}</span>
          {count > 0 ? (
            <Badge variant="info" className="h-5 min-h-0 min-w-5 justify-center px-1 font-bold">
              {count}
            </Badge>
          ) : null}
          <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn('z-[80]', STATUS_MENU_CONTENT_CLASS)}
      >
        <StatusFilterItems active={active} onToggle={onToggle} />
        {count > 0 && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <button
              type="button"
              onClick={onClear}
              className="flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t.appointments.clearFilters}
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ScheduleToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  departments,
  statusFilters,
  onToggleStatus,
  onClearStatuses,
  count,
  isLoading,
  onNewPatient,
  onNewAppointment,
}: Props) {
  const { t, lang } = useLanguage();

  const tabLabels: Record<'calendar' | 'doctors' | 'queue', string> = {
    calendar: t.appointments.calendar,
    doctors: t.appointments.doctorTimeline,
    queue: t.appointments.waitingRoom,
  };

  return (
    <div
      data-schedule-toolbar=""
      className="card-aura flex flex-col gap-2 rounded-xl border bg-card/90 p-2 shadow-xs backdrop-blur-md sm:rounded-2xl sm:p-2.5"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto rounded-lg border bg-muted/50 p-0.5 shadow-2xs scrollbar-none">
          {VIEW_TABS.map(({ id, icon: Icon, match, target }) => {
            const active = match(view);
            const label = tabLabels[id];
            return (
              <SoftTip key={id} label={label}>
                <button
                  type="button"
                  onClick={() => onViewChange(target(view))}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition-all duration-150 cursor-pointer active:scale-95 sm:flex-initial sm:gap-1.5 sm:px-2.5 sm:text-xs',
                    active
                      ? 'bg-background font-bold text-foreground shadow-xs ring-1 ring-border/50'
                      : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-3.5 shrink-0',
                      id === 'queue' ? 'text-warning' : 'text-primary',
                    )}
                  />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              </SoftTip>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <SoftTip label={t.appointments.addPatient}>
            <Button
              variant="outline"
              size="sm"
              onClick={onNewPatient}
              aria-label={t.appointments.addPatient}
              className="size-8 shrink-0 px-0 shadow-2xs active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
            >
              <IconNewPatient className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="hidden font-semibold sm:inline">{t.appointments.patient}</span>
            </Button>
          </SoftTip>
          <SoftTip label={t.appointments.addAppointment}>
            <Button
              size="sm"
              onClick={onNewAppointment}
              aria-label={t.appointments.addAppointment}
              className="size-8 shrink-0 px-0 active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
            >
              <IconAdd className="size-3.5 shrink-0" />
              <span className="hidden font-semibold sm:inline">{t.appointments.appointment}</span>
            </Button>
          </SoftTip>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t.appointments.searchPlaceholder}
          className="min-w-0 w-full sm:max-w-64 sm:flex-1 lg:max-w-72"
        />

        <div className="flex min-w-0 items-center gap-1.5 sm:contents">
          <SearchablePicker
            size="sm"
            options={(departments ?? []).map((dept) => ({
              value: dept.id,
              label: (lang === 'ar' && dept.nameAr) || dept.name,
            }))}
            value={departmentId || FORM_ALL}
            onChange={(next) => onDepartmentChange(next === FORM_ALL ? '' : next)}
            extraOption={{ value: FORM_ALL, label: t.appointments.departments }}
            placeholder={t.appointments.departments}
            searchPlaceholder={t.appointments.searchPlaceholder}
            className="h-9 min-w-0 flex-1 bg-background/50 sm:w-52 sm:flex-none"
          />

          <StatusFilterDropdown
            active={statusFilters}
            onToggle={onToggleStatus}
            onClear={onClearStatuses}
          />

          {isLoading ? (
            <Badge variant="muted" className="h-9 sm:ms-auto">
              <Spinner size="sm" className="text-primary" />
            </Badge>
          ) : (
            <SoftTip label={`${count} ${t.appointments.appts}`}>
              <Badge
                variant="success"
                className="h-9 tabular-nums sm:ms-auto"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-success" />
                <span>{count}</span>
                <span className="hidden sm:inline">{t.appointments.appts}</span>
               </Badge>
            </SoftTip>
          )}
        </div>
      </div>
    </div>
  );
}

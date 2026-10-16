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
import { IconAdd, IconChevronDown, IconNewPatient } from '@/constants/icons';
import { STATUS_MENU_CONTENT_CLASS, StatusFilterItems } from '../shared/status-menu';
import { useLanguage } from '@/providers';

interface Props {
  view: ScheduleView;
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
            'h-9 shrink-0 gap-1 border-border/70 bg-background/50 px-2.5 text-xs font-semibold shadow-2xs sm:text-[0.8rem]',
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
        className={cn('z-80', STATUS_MENU_CONTENT_CLASS)}
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

  const title = view === 'doctors'
    ? t.appointments.doctorTimeline
    : view === 'queue'
      ? t.queue.waitingQueue
      : t.appointments.calendar;
  const searchPlaceholder = view === 'doctors'
    ? t.appointments.searchDoctors
    : view === 'queue'
      ? t.appointments.searchPatients
      : t.appointments.searchPlaceholder;

  return (
    <div
      data-schedule-toolbar=""
      className="card-aura flex flex-col gap-2 rounded-xl border bg-card/90 p-2 shadow-xs backdrop-blur-md sm:rounded-2xl sm:p-2.5"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="min-w-0 flex-1 px-1">
          <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{title}</h1>
          <p className="text-xs text-muted-foreground">{count} {t.appointments.appts}</p>
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

      <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2 sm:flex-row sm:items-center sm:gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="min-w-0 w-full flex-1"
        />
        <div className="flex shrink-0 items-center gap-1.5">
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
            className="h-9 min-w-0 flex-1 bg-background/50 sm:w-52 sm:max-w-56 sm:flex-none"
          />

          <StatusFilterDropdown
            active={statusFilters}
            onToggle={onToggleStatus}
            onClear={onClearStatuses}
          />

          {isLoading ? (
            <Badge
              variant="muted"
              className="size-9 justify-center rounded-full p-0"
            >
              <Spinner size="sm" className="text-primary" />
            </Badge>
          ) : (
            <SoftTip label={`${count} ${t.appointments.appts}`}>
              <Badge
                variant="default"
                className="h-9 min-w-9 justify-center rounded-full px-2 tabular-nums"
              >
                {count}
              </Badge>
            </SoftTip>
          )}
        </div>
      </div>
    </div>
  );
}

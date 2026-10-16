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
  onNewPatient,
  onNewAppointment,
}: Props) {
  const { t, lang } = useLanguage();

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
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1"
        />

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

      <div className="flex items-center gap-1.5 border-t border-border/40 pt-2 sm:gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
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
        </div>
        <StatusFilterDropdown
          active={statusFilters}
          onToggle={onToggleStatus}
          onClear={onClearStatuses}
        />
      </div>
    </div>
  );
}

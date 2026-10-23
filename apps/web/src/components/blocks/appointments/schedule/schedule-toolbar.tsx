'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Popover,
} from '@/components/ui';
import {
  DirectoryToolbar,
  DIRECTORY_ACTION_CLASS,
  FilterPanel,
  FilterTrigger,
  FormField,
  SearchablePicker,
  SoftTip,
} from '@/components/primitives';
import type { Department } from '@/services/departments.service';
import type { AppointmentStatus } from '@/services/appointments.service';
import type { ScheduleView } from './schedule-nav';
import { FORM_ALL } from '@/constants/form';
import { cn } from '@/lib/utils';
import { IconAdd, IconChevronDown, IconNewPatient } from '@/constants/icons';
import { StatusFilterItems } from '../shared/status-menu';
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
  onNewPatient?: () => void;
  onNewAppointment?: () => void;
  extraFilterCount?: number;
  onClearExtraFilters?: () => void;
  pickerSlotRef?: (element: HTMLDivElement | null) => void;
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
            'h-8 w-full justify-between gap-1.5 bg-background px-2.5 font-normal',
            count > 0 && 'border-primary/35 bg-primary/5 text-foreground',
          )}
        >
          <span className="min-w-0 flex-1 truncate text-start">{t.appointments.status}</span>
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
        className="z-120 w-(--radix-dropdown-menu-trigger-width) max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))]"
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
  pickerSlotRef,
  extraFilterCount = 0,
  onClearExtraFilters,
}: Props) {
  const { t, lang } = useLanguage();

  const searchPlaceholder = view === 'doctors'
    ? t.appointments.searchDoctors
    : view === 'queue'
      ? t.appointments.searchPatients
      : t.appointments.searchPlaceholder;

  const count = Number(Boolean(departmentId)) + Number(statusFilters.size > 0) + extraFilterCount;
  const clear = () => {
    onDepartmentChange('');
    onClearStatuses();
    onClearExtraFilters?.();
  };

  return (
    <div data-schedule-toolbar="" data-focus-hide="" className="shrink-0">
      <DirectoryToolbar search={search} onSearchChange={onSearchChange} searchPlaceholder={searchPlaceholder} actions={
        <>
          <Popover>
            <FilterTrigger count={count} />
            <FilterPanel count={count} onClear={clear}>
              <FormField label={t.appointments.departments}>
                <SearchablePicker
                  size="sm"
                  options={(departments ?? []).map((dept) => ({ value: dept.id, label: (lang === 'ar' && dept.nameAr) || dept.name }))}
                  value={departmentId || FORM_ALL}
                  onChange={(next) => onDepartmentChange(next === FORM_ALL ? '' : next)}
                  extraOption={{ value: FORM_ALL, label: t.appointments.departments }}
                  placeholder={t.appointments.departments}
                  searchPlaceholder={t.appointments.searchPlaceholder}
                />
              </FormField>
              {view === 'doctors' || view === 'queue' ? (
                <FormField label={view === 'doctors' ? t.practitioner.practitioner : t.queue.waitingQueue}>
                  <div ref={pickerSlotRef} className="min-w-0" />
                </FormField>
              ) : null}
              <FormField label={t.appointments.status}>
                <StatusFilterDropdown active={statusFilters} onToggle={onToggleStatus} onClear={onClearStatuses} />
              </FormField>
            </FilterPanel>
          </Popover>
          {onNewPatient && (
            <SoftTip label={t.appointments.addPatient}>
              <Button
                variant="outline"
                size="sm"
                onClick={onNewPatient}
                aria-label={t.appointments.addPatient}
                className={DIRECTORY_ACTION_CLASS}
              >
                <IconNewPatient className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="hidden font-semibold sm:inline">{t.appointments.patient}</span>
              </Button>
            </SoftTip>
          )}
          {onNewAppointment && (
            <SoftTip label={t.appointments.addAppointment}>
              <Button
                size="sm"
                onClick={onNewAppointment}
                aria-label={t.appointments.addAppointment}
                className={DIRECTORY_ACTION_CLASS}
              >
                <IconAdd className="size-3.5 shrink-0" />
                <span className="hidden font-semibold sm:inline">{t.appointments.appointment}</span>
              </Button>
            </SoftTip>
          )}
        </>
      } />
    </div>
  );
}

'use client';

import { Calendar, ChevronDown, Plus, Timer, Users } from 'lucide-react';
import { IconNewPatient } from '@/constants/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '@/components/primitives/search-input';
import { Spinner } from '@/components/primitives/spinner';
import type { Department } from '@/services/departments.service';
import type { AppointmentStatus } from '@/services/appointments.service';
import type { ScheduleView } from './schedule-nav';
import {
  SCHEDULE_FILTER_STATUSES,
  STATUS_COLORS,
  STATUS_CONFIG,
} from './status-badge';
import { cn } from '@/lib/utils';

const ALL_DEPARTMENTS = '__all__';

const VIEW_TABS: {
  id: ScheduleView | 'calendar';
  label: string;
  short: string;
  icon: typeof Calendar;
  match: (view: ScheduleView) => boolean;
  target: (view: ScheduleView) => ScheduleView;
}[] = [
  {
    id: 'calendar',
    label: 'Calendar',
    short: 'Cal',
    icon: Calendar,
    match: (v) => v === 'month' || v === 'week' || v === 'day',
    target: (v) => (v === 'month' || v === 'week' || v === 'day' ? v : 'month'),
  },
  {
    id: 'doctors',
    label: 'Doctor Timeline',
    short: 'Doctors',
    icon: Users,
    match: (v) => v === 'doctors',
    target: () => 'doctors',
  },
  {
    id: 'queue',
    label: 'Waiting Room',
    short: 'Waiting',
    icon: Timer,
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
          <span className="truncate text-muted-foreground">Status</span>
          {count > 0 ? (
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
              {count}
            </span>
          ) : null}
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="z-[80] w-[min(100vw-1.5rem,13rem)] p-1.5"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Filter by status
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        {SCHEDULE_FILTER_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <DropdownMenuCheckboxItem
              key={status}
              checked={active.has(status)}
              onCheckedChange={() => onToggle(status)}
              onSelect={(e) => e.preventDefault()}
              className="gap-2 rounded-md px-2 py-1.5 text-xs font-medium"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
                aria-hidden
              />
              {cfg.label}
            </DropdownMenuCheckboxItem>
          );
        })}
        {count > 0 && (
          <>
            <DropdownMenuSeparator className="my-1" />
            <button
              type="button"
              onClick={onClear}
              className="flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Clear filters
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
  return (
    <div className="card-aura flex flex-col gap-2 rounded-xl border bg-card/90 p-2 shadow-xs backdrop-blur-md sm:rounded-2xl sm:p-2.5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto rounded-lg border bg-muted/50 p-0.5 shadow-2xs scrollbar-none">
          {VIEW_TABS.map(({ id, label, short, icon: Icon, match, target }) => {
            const active = match(view);
            return (
              <button
                key={id}
                type="button"
                title={label}
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
                    id === 'queue' ? 'text-amber-500' : 'text-primary',
                  )}
                />
                <span className="truncate sm:hidden">{short}</span>
                <span className="hidden truncate sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewPatient}
            title="Add patient"
            aria-label="Add patient"
            className="size-8 shrink-0 px-0 shadow-2xs active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
          >
            <IconNewPatient className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="hidden font-semibold sm:inline">Patient</span>
          </Button>
          <Button
            size="sm"
            onClick={onNewAppointment}
            title="Add appointment"
            aria-label="Add appointment"
            className="size-8 shrink-0 px-0 active:scale-95 sm:h-8 sm:w-auto sm:gap-1.5 sm:px-2.5"
          >
            <Plus className="size-3.5 shrink-0" />
            <span className="hidden font-semibold sm:inline">Appointment</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search patients, doctors…"
          className="min-w-0 w-full sm:max-w-64 sm:flex-1 lg:max-w-72"
        />

        <div className="flex min-w-0 items-center gap-1.5 sm:contents">
          <Select
            value={departmentId || ALL_DEPARTMENTS}
            onValueChange={(v) => onDepartmentChange(v === ALL_DEPARTMENTS ? '' : v)}
          >
            <SelectTrigger
              size="sm"
              className="h-9 min-w-0 flex-1 bg-background/50 sm:w-44 sm:flex-none"
            >
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
              <SelectItem value={ALL_DEPARTMENTS}>All departments</SelectItem>
              {departments?.map((d) => (
                <SelectItem key={d.id} value={d.id} textValue={d.name} title={d.name}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <StatusFilterDropdown
            active={statusFilters}
            onToggle={onToggleStatus}
            onClear={onClearStatuses}
          />

          {isLoading ? (
            <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/50 px-2 text-[11px] font-medium text-muted-foreground sm:ml-auto">
              <Spinner size="sm" className="text-primary" />
            </span>
          ) : (
            <span
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-2 tabular-nums text-[11px] font-semibold text-foreground/85 shadow-2xs sm:ml-auto"
              title={`${count} appointment${count === 1 ? '' : 's'}`}
            >
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{count}</span>
              <span className="hidden sm:inline">appt{count === 1 ? '' : 's'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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
  short?: string;
  icon: typeof Calendar;
  match: (view: ScheduleView) => boolean;
  target: (view: ScheduleView) => ScheduleView;
}[] = [
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    match: (v) => v === 'month' || v === 'week' || v === 'day',
    target: (v) => (v === 'month' || v === 'week' || v === 'day' ? v : 'month'),
  },
  {
    id: 'doctors',
    label: 'Doctor Timeline',
    short: 'Timeline',
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
            'h-9 shrink-0 gap-1.5 border-border/70 bg-background/50 px-2.5 font-semibold shadow-2xs',
            count > 0 && 'border-primary/35 bg-primary/5 text-foreground',
          )}
        >
          <span className="text-muted-foreground">Status</span>
          {count > 0 ? (
            <span className="inline-flex size-5 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
              {count}
            </span>
          ) : (
            <span className="hidden text-muted-foreground sm:inline">All</span>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="z-[80] w-52 p-1.5">
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center overflow-x-auto rounded-lg border bg-muted/50 p-0.5 shadow-2xs scrollbar-none">
          {VIEW_TABS.map(({ id, label, short, icon: Icon, match, target }) => {
            const active = match(view);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onViewChange(target(view))}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 sm:flex-initial sm:px-2.5',
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
                <span className={short ? 'hidden sm:inline' : undefined}>{label}</span>
                {short ? <span className="sm:hidden">{short}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewPatient}
            className="h-8 flex-1 gap-1.5 px-2.5 font-semibold shadow-2xs active:scale-95 sm:flex-initial"
          >
            <IconNewPatient className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="hidden sm:inline">Add Patient</span>
            <span className="sm:hidden">Patient</span>
          </Button>
          <Button
            size="sm"
            onClick={onNewAppointment}
            className="h-8 flex-1 gap-1.5 px-2.5 font-semibold active:scale-95 sm:flex-initial"
          >
            <Plus className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">Add Appointment</span>
            <span className="sm:hidden">Appointment</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2 sm:gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search patient, doctor, service…"
          className="min-w-0 flex-1 basis-40 sm:max-w-64 sm:flex-none"
        />
        <Select
          value={departmentId || ALL_DEPARTMENTS}
          onValueChange={(v) => onDepartmentChange(v === ALL_DEPARTMENTS ? '' : v)}
        >
          <SelectTrigger
            size="sm"
            className="h-9 w-auto min-w-36 max-w-48 shrink-0 bg-background/50 sm:w-44"
          >
            <SelectValue placeholder="All departments" />
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
          <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/50 px-2 text-[11px] font-medium text-muted-foreground">
            <Spinner size="sm" className="text-primary" />
            <span className="hidden sm:inline">Loading…</span>
          </span>
        ) : (
          <span
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-2 tabular-nums text-[11px] font-semibold text-foreground/85 shadow-2xs"
            title={`${count} appointment${count === 1 ? '' : 's'}`}
          >
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="sm:hidden">{count}</span>
            <span className="hidden sm:inline">
              {count} appt{count === 1 ? '' : 's'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

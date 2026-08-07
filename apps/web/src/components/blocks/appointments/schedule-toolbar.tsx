'use client';

import { Calendar, Plus, Timer, Users } from 'lucide-react';
import { IconNewPatient } from '@/constants/icons';
import { Button } from '@/components/ui/button';
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
import type { ScheduleView } from './schedule-nav';
import { cn } from '@/lib/utils';

const ALL_DEPARTMENTS = '__all__';

interface Props {
  view: ScheduleView;
  onViewChange: (view: ScheduleView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  departments: Department[] | undefined;
  count: number;
  isLoading: boolean;
  onNewPatient: () => void;
  onNewAppointment: () => void;
}

export function ScheduleToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  departments,
  count,
  isLoading,
  onNewPatient,
  onNewAppointment,
}: Props) {
  const isCalendarView = view === 'month' || view === 'week' || view === 'day';

  return (
    <div className="card-aura flex flex-col gap-2.5 rounded-2xl border bg-card/90 p-2.5 shadow-xs backdrop-blur-md sm:gap-3 sm:p-3.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center overflow-x-auto rounded-xl border bg-muted/50 p-1 shadow-2xs scrollbar-none">
          <button
            type="button"
            onClick={() => onViewChange(isCalendarView ? view : 'month')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 sm:flex-initial sm:px-3',
              isCalendarView
                ? 'bg-background font-bold text-foreground shadow-xs ring-1 ring-border/50'
                : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
            )}
          >
            <Calendar className="size-3.5 shrink-0 text-primary" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('doctors')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 sm:flex-initial sm:px-3',
              view === 'doctors'
                ? 'bg-background font-bold text-foreground shadow-xs ring-1 ring-border/50'
                : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
            )}
          >
            <Users className="size-3.5 shrink-0 text-primary" />
            <span>Doctor Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('queue')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 sm:flex-initial sm:px-3',
              view === 'queue'
                ? 'bg-background font-bold text-foreground shadow-xs ring-1 ring-border/50'
                : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
            )}
          >
            <Timer className="size-3.5 shrink-0 text-amber-500" />
            <span className="hidden sm:inline">Waiting Room</span>
            <span className="sm:hidden">Waiting</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewPatient}
            className="flex-1 items-center justify-center gap-1.5 font-semibold shadow-2xs transition-all duration-150 hover:bg-muted/80 active:scale-95 sm:flex-initial"
          >
            <IconNewPatient className="size-4 shrink-0 text-muted-foreground" />
            <span className="hidden sm:inline">Add Patient</span>
            <span className="sm:hidden">Patient</span>
          </Button>
          <Button
            size="sm"
            onClick={onNewAppointment}
            className="flex-1 items-center justify-center gap-1.5 font-semibold transition-all duration-150 hover:shadow-md active:scale-95 sm:flex-initial"
          >
            <Plus className="size-4 shrink-0" />
            <span className="hidden sm:inline">Add Appointment</span>
            <span className="sm:hidden">Appointment</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-2.5">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search patient, doctor, service…"
          className="min-w-0 flex-1 basis-48 sm:max-w-72 sm:flex-none"
        />
        <Select
          value={departmentId || ALL_DEPARTMENTS}
          onValueChange={(v) => onDepartmentChange(v === ALL_DEPARTMENTS ? '' : v)}
        >
          <SelectTrigger size="sm" className="h-9 w-auto min-w-38 max-w-56 shrink-0 bg-background/50 sm:w-48">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
            <SelectItem value={ALL_DEPARTMENTS}>All departments</SelectItem>
            {departments?.map((d) => (
              <SelectItem
                key={d.id}
                value={d.id}
                textValue={d.name}
                title={d.name}
                className="items-center *:[span]:last:truncate *:[span]:last:whitespace-nowrap *:[span]:last:break-normal"
              >
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <span
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/50 bg-muted/50 px-2 text-[11px] font-medium text-muted-foreground"
            title="Loading appointments"
          >
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

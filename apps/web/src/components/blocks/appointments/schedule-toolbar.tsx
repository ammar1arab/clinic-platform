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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center rounded-lg border bg-muted/40 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => onViewChange(isCalendarView ? view : 'month')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
              isCalendarView
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Calendar className="size-3.5" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('doctors')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
              view === 'doctors'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Users className="size-3.5" />
            <span>Doctor Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('queue')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
              view === 'queue'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Timer className="size-3.5 text-amber-500" />
            <span>Waiting Room</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewPatient} className="shrink-0 transition-all active:scale-95">
            <IconNewPatient className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Patient</span>
          </Button>
          <Button size="sm" onClick={onNewAppointment} className="shrink-0 transition-all active:scale-95 hover:shadow-md">
            <Plus className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Add Appointment</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search patient, service, or doctor…"
            className="min-w-0 flex-1 sm:max-w-64"
          />
          <Select
            value={departmentId || ALL_DEPARTMENTS}
            onValueChange={(v) => onDepartmentChange(v === ALL_DEPARTMENTS ? '' : v)}
          >
            <SelectTrigger size="sm" className="h-9 w-36 shrink-0 sm:w-44">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
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
        </div>

        <div className="flex min-h-4 items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Spinner size="sm" className="text-muted-foreground" />
              Loading appointments…
            </span>
          ) : (
            <span className="whitespace-nowrap font-medium">
              {count} appointment{count === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

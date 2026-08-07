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
    <div className="card-aura flex flex-col gap-3 rounded-2xl border bg-card/90 p-3 sm:p-4 shadow-xs backdrop-blur-md">
      {/* Row 1: View Switcher + Primary Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* View Switcher Tabs */}
        <div className="flex items-center rounded-xl border bg-muted/50 p-1 shadow-2xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => onViewChange(isCalendarView ? view : 'month')}
            className={cn(
              'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap',
              isCalendarView
                ? 'bg-background text-foreground shadow-xs ring-1 ring-border/50 font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
            )}
          >
            <Calendar className="size-3.5 shrink-0 text-primary" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('doctors')}
            className={cn(
              'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap',
              view === 'doctors'
                ? 'bg-background text-foreground shadow-xs ring-1 ring-border/50 font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
            )}
          >
            <Users className="size-3.5 shrink-0 text-primary" />
            <span>Doctor Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => onViewChange('queue')}
            className={cn(
              'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 whitespace-nowrap',
              view === 'queue'
                ? 'bg-background text-foreground shadow-xs ring-1 ring-border/50 font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
            )}
          >
            <Timer className="size-3.5 shrink-0 text-amber-500" />
            <span>Waiting Room</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewPatient}
            className="flex-1 sm:flex-initial items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:bg-muted/80 shadow-2xs font-semibold"
          >
            <IconNewPatient className="size-4 shrink-0 text-muted-foreground" />
            <span>Add Patient</span>
          </Button>
          <Button
            size="sm"
            onClick={onNewAppointment}
            className="flex-1 sm:flex-initial items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:shadow-md font-semibold"
          >
            <Plus className="size-4 shrink-0" />
            <span>Add Appointment</span>
          </Button>
        </div>
      </div>

      {/* Row 2: Search, Department Filter, and Live Count */}
      <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between border-t border-border/40">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search patient, doctor, service…"
            className="w-full sm:max-w-72"
          />
          <Select
            value={departmentId || ALL_DEPARTMENTS}
            onValueChange={(v) => onDepartmentChange(v === ALL_DEPARTMENTS ? '' : v)}
          >
            <SelectTrigger size="sm" className="h-9 w-full sm:w-48 shrink-0 bg-background/50">
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

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-muted-foreground shrink-0">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium">
              <Spinner size="sm" className="text-primary" />
              Loading appointments…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 font-semibold text-foreground/80 border border-border/40 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500" />
              {count} appointment{count === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

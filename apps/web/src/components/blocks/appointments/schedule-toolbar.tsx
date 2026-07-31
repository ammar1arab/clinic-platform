'use client';

import { Plus } from 'lucide-react';
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

const ALL_DEPARTMENTS = '__all__';

interface Props {
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
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search patient or service…"
          className="min-w-0 flex-1 sm:max-w-56"
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

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-h-4 items-center gap-1.5 text-xs text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Spinner size="sm" className="text-muted-foreground" />
              Loading appointments…
            </span>
          ) : (
            <span className="whitespace-nowrap">
              {count} appointment{count === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewPatient} className="shrink-0">
            <IconNewPatient className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Patient</span>
          </Button>
          <Button size="sm" onClick={onNewAppointment} className="shrink-0">
            <Plus className="size-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Add Appointment</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

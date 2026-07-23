'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/primitives/date-picker';
import { FormField } from '@/components/primitives/form-field';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { GENDERS, BLOOD_TYPES, PATIENT_SORTS } from '@/constants/patient';
import type { ClinicStaffMember } from '@/services/clinics.service';
import type { Department } from '@/services/departments.service';

export interface PatientFilterState {
  search: string;
  status: string;
  gender: string;
  bloodType: string;
  primaryDoctorId: string;
  departmentId: string;
  visitFrom: string;
  visitTo: string;
  dobFrom: string;
  dobTo: string;
  sort: string;
}

const ANY = '__any__';

interface Props {
  values: PatientFilterState;
  onChange: (patch: Partial<PatientFilterState>) => void;
  onReset: () => void;
  staff?: ClinicStaffMember[];
  departments?: Department[];
}

export function PatientFiltersBlock({
  values,
  onChange,
  onReset,
  staff,
  departments,
}: Props) {
  const activeCount =
    (values.status !== 'all' ? 1 : 0) +
    (values.gender ? 1 : 0) +
    (values.bloodType ? 1 : 0) +
    (values.primaryDoctorId ? 1 : 0) +
    (values.departmentId ? 1 : 0) +
    (values.visitFrom ? 1 : 0) +
    (values.visitTo ? 1 : 0) +
    (values.dobFrom ? 1 : 0) +
    (values.dobTo ? 1 : 0);

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, ID, or email..."
          className="pl-8"
          value={values.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <Select value={values.sort} onValueChange={(v) => onChange({ sort: v })}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {PATIENT_SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <SlidersHorizontal className="size-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 && (
                <Badge className="ml-1.5 h-5 min-w-5 justify-center px-1 text-xs">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 space-y-3"
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement | null;
              if (
                target?.closest('[data-slot="select-content"]') ||
                target?.closest('[data-slot="popover-content"]') ||
                target?.closest('[data-slot="calendar"]') ||
                target?.closest('[data-radix-select-content]') ||
                target?.closest('[data-radix-popper-content-wrapper]')
              ) {
                e.preventDefault();
              }
            }}
            onFocusOutside={(e) => {
              const target = e.target as HTMLElement | null;
              if (
                target?.closest('[data-slot="select-content"]') ||
                target?.closest('[data-slot="popover-content"]') ||
                target?.closest('[data-slot="calendar"]')
              ) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filters</p>
              {activeCount > 0 && (
                <Button variant="ghost" size="xs" onClick={onReset}>
                  <X className="size-3.5" />
                  Clear
                </Button>
              )}
            </div>

            <FormField label="Status" labelClassName="text-xs">
              <Select value={values.status} onValueChange={(v) => onChange({ status: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Practitioner" labelClassName="text-xs">
              <Select
                value={values.primaryDoctorId || ANY}
                onValueChange={(v) => onChange({ primaryDoctorId: v === ANY ? '' : v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {staff?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Department" labelClassName="text-xs">
              <Select
                value={values.departmentId || ANY}
                onValueChange={(v) => onChange({ departmentId: v === ANY ? '' : v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Gender" labelClassName="text-xs">
                <Select
                  value={values.gender || ANY}
                  onValueChange={(v) => onChange({ gender: v === ANY ? '' : v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    {GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Blood Type" labelClassName="text-xs">
                <Select
                  value={values.bloodType || ANY}
                  onValueChange={(v) => onChange({ bloodType: v === ANY ? '' : v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    {BLOOD_TYPES.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Visit from" labelClassName="text-xs">
                <DatePicker
                  value={values.visitFrom}
                  onChange={(v) => onChange({ visitFrom: v })}
                  placeholder="From"
                />
              </FormField>
              <FormField label="Visit to" labelClassName="text-xs">
                <DatePicker
                  value={values.visitTo}
                  onChange={(v) => onChange({ visitTo: v })}
                  placeholder="To"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Born after" labelClassName="text-xs">
                <DatePicker
                  value={values.dobFrom}
                  onChange={(v) => onChange({ dobFrom: v })}
                  placeholder="From"
                  withDropdown
                  toDate={new Date()}
                />
              </FormField>
              <FormField label="Born before" labelClassName="text-xs">
                <DatePicker
                  value={values.dobTo}
                  onChange={(v) => onChange({ dobTo: v })}
                  placeholder="To"
                  withDropdown
                  toDate={new Date()}
                />
              </FormField>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

'use client';

import { SearchablePicker } from '@/components/primitives';
import { IconPractitioner } from '@/constants/icons';
import { formatDoctorLabel } from './appointment-display';
import { staffRoleLabel } from './appointment-form.mapper';

export type DoctorOption = {
  id: string;
  name: string;
  role?: string | null;
};

export function DoctorCombobox({
  doctors,
  value,
  onChange,
  placeholder = 'Select doctor',
  extraOption,
  className,
  size = 'default',
}: {
  doctors: DoctorOption[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  extraOption?: { value: string; label: string };
  className?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <SearchablePicker
      options={(doctors ?? []).map((doctor) => ({
        value: doctor.id,
        label: `${formatDoctorLabel(doctor.name)}${staffRoleLabel(doctor.role)}`,
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search doctors…"
      emptyText="No doctors found."
      extraOption={extraOption}
      leading={<IconPractitioner className="size-4 shrink-0 opacity-70" />}
      className={className}
      size={size}
    />
  );
}

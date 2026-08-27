'use client';

import { SearchablePicker } from '@/components/primitives';
import { IconPerson } from '@/constants/icons';
import { formatPersonName } from './appointment-display';
import type { Patient } from '@/services/patients.service';

export function PatientCombobox({
  patients,
  value,
  onChange,
  placeholder = 'Select patient',
}: {
  patients: Patient[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  return (
    <SearchablePicker
      options={(patients ?? []).map((patient) => ({
        value: patient.id,
        label: formatPersonName(patient),
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchPlaceholder="Search patients…"
      emptyText="No patients found."
      leading={<IconPerson className="size-4 shrink-0 opacity-70" />}
      className="w-full"
    />
  );
}

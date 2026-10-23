'use client';

import { EntityAvatar, SearchablePicker } from '@/components/primitives';
import { IconPatients } from '@/constants/icons';
import { formatPersonName } from '../shared/appointment-display';
import type { Patient } from '@/services/patients.service';
import { useLanguage } from '@/providers';

export function PatientCombobox({
  patients,
  value,
  onChange,
  placeholder,
}: {
  patients: Patient[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const { t, lang } = useLanguage();

  return (
    <SearchablePicker
      loading={patients === undefined}
      options={(patients ?? []).map((patient) => ({
        value: patient.id,
        label: formatPersonName(patient, lang),
        leading: <EntityAvatar src={patient.imageUrl} seed={patient.id} size="sm" />,
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder || t.appointments.selectPatient}
      searchPlaceholder={t.appointments.searchPatients}
      emptyText={t.patient.noPatients}
      leading={<IconPatients className="size-4 shrink-0 opacity-70" />}
      className="w-full"
    />
  );
}

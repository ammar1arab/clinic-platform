'use client';

import { SearchablePicker } from '@/components/primitives';
import { IconPerson } from '@/constants/icons';
import { formatPersonName } from './appointment-display';
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
      options={(patients ?? []).map((patient) => ({
        value: patient.id,
        label: formatPersonName(patient, lang),
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder || (t?.appointments?.selectPatient ?? 'Select patient')}
      searchPlaceholder={
        t?.appointments?.searchPlaceholder ??
        (lang === 'ar' ? 'البحث عن مريض...' : 'Search patients…')
      }
      emptyText={
        t?.patient?.noPatients ??
        (lang === 'ar' ? 'لم يتم العثور على مرضى.' : 'No patients found.')
      }
      leading={<IconPerson className="size-4 shrink-0 opacity-70" />}
      className="w-full"
    />
  );
}

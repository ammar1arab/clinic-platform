'use client';

import { SearchablePicker } from '@/components/primitives';
import { IconPractitioner } from '@/constants/icons';
import { formatDoctorLabel, staffRoleLabel } from './appointment-display';
import { useLanguage } from '@/providers';

export type DoctorOption = {
  id: string;
  name: string;
  nameAr?: string | null;
  role?: string | null;
};

export function DoctorCombobox({
  doctors,
  value,
  onChange,
  placeholder,
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
  const { t, lang } = useLanguage();

  return (
    <SearchablePicker
      options={(doctors ?? []).map((doctor) => ({
        value: doctor.id,
        label: `${formatDoctorLabel(doctor, { lang })}${staffRoleLabel(doctor.role, lang)}`,
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder || t.appointments.selectDoctor}
      searchPlaceholder={t.appointments.searchDoctors}
      emptyText={t.practitioner.noPractitioners}
      extraOption={extraOption}
      leading={<IconPractitioner className="size-4 shrink-0 opacity-70" />}
      className={className}
      size={size}
    />
  );
}

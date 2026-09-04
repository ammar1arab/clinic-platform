'use client';

import { Badge } from '@/components/ui';
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

function CountBadge({ count }: { count: number }) {
  return (
    <Badge variant="muted" className="min-h-5 px-2 text-[11px] tabular-nums">
      {count}
    </Badge>
  );
}

export function DoctorCombobox({
  doctors,
  value,
  onChange,
  placeholder,
  extraOption,
  counts,
  className,
  size = 'default',
}: {
  doctors: DoctorOption[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  extraOption?: { value: string; label: string };
  counts?: Record<string, number>;
  className?: string;
  size?: 'default' | 'sm';
}) {
  const { t, lang } = useLanguage();

  return (
    <SearchablePicker
      options={(doctors ?? []).map((doctor) => ({
        value: doctor.id,
        label: `${formatDoctorLabel(doctor, { lang })}${staffRoleLabel(doctor.role, lang)}`,
        end: counts ? <CountBadge count={counts[doctor.id] ?? 0} /> : undefined,
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder || t.appointments.selectDoctor}
      searchPlaceholder={t.appointments.searchDoctors}
      emptyText={t.practitioner.noPractitioners}
      extraOption={
        extraOption
          ? {
              ...extraOption,
              end: counts ? <CountBadge count={counts[extraOption.value] ?? 0} /> : undefined,
            }
          : undefined
      }
      leading={<IconPractitioner className="size-4 shrink-0 opacity-70" />}
      className={className}
      size={size}
    />
  );
}

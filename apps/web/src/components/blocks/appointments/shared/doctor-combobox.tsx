'use client';

import { IconPractitioner } from '@/constants/icons';
import { Badge } from '@/components/ui';
import { EntityAvatar, SearchablePicker } from '@/components/primitives';
import { formatDoctorLabel } from './appointment-display';
import { useLanguage } from '@/providers';

export type DoctorOption = {
  id: string;
  name: string;
  nameAr?: string | null;
  role?: string | null;
  imageUrl?: string | null;
};

function CountBadge({ count }: { count: number }) {
  return (
    <Badge variant="muted" className="min-h-5 px-2 text-2xs tabular-nums">
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
  loading,
  counts,
  className,
  size = 'default',
}: {
  doctors: DoctorOption[] | undefined;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  extraOption?: { value: string; label: string };
  loading?: boolean;
  counts?: Record<string, number>;
  className?: string;
  size?: 'default' | 'sm';
}) {
  const { t, lang } = useLanguage();

  return (
    <SearchablePicker
      loading={loading ?? doctors === undefined}
      options={(doctors ?? []).map((doctor) => ({
        value: doctor.id,
        label: formatDoctorLabel(doctor, { lang }),
        leading: <EntityAvatar src={doctor.imageUrl} seed={doctor.id} size="sm" />,
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

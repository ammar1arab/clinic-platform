import { Skeleton } from '@/components/ui';
import { IconCard, type IconWellAccent } from '@/components/primitives';
import type { LucideIcon } from '@/constants/icons';

interface Props {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  accent?: IconWellAccent;
  isLoading?: boolean;
}

export function KpiCardBlock({
  label,
  value,
  icon,
  accent = 'default',
  isLoading = false,
}: Props) {
  return (
    <IconCard
      icon={icon}
      accent={accent}
      title={
        isLoading || value === undefined || value === null ? (
          <Skeleton className="h-7 w-16 rounded-md mb-1" />
        ) : (
          <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums leading-none">
            {value}
          </span>
        )
      }
      description={label}
      orientation="horizontal"
      className="cursor-default border border-border"
    />
  );
}

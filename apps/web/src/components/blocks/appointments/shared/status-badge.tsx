'use client';

import { Badge } from '@/components/ui';
import { SoftTip } from '@/components/primitives';
import { cn } from '@/lib/utils';
import { STATUS_BADGE_VARIANT, getStatusConfig } from '@/constants/appointment';
import type { AppointmentStatus } from '@/services/appointments.service';
import { useLanguage } from '@/providers';
export {
  STATUS_COLORS,
  getStatusConfig,
  STATUS_OPTIONS,
  STATUS_BADGE_VARIANT,
  SCHEDULE_FILTER_STATUSES,
} from '@/constants/appointment';

type Props = {
  status: AppointmentStatus;
  className?: string;
  compact?: boolean;
  tip?: boolean;
};

export function StatusBadgeBlock({
  status,
  className,
  compact,
  tip = true,
}: Props) {
  const { t } = useLanguage();
  const config = getStatusConfig(t)[status];
  const translatedLabel = config.label;
  const translatedShort = config.short;
  const text = compact ? translatedShort : translatedLabel;

  return (
    <SoftTip label={tip ? translatedLabel : undefined}>
      <Badge
        variant={STATUS_BADGE_VARIANT[status]}
        aria-label={translatedLabel}
        className={cn(
          'max-w-none shrink-0 [&>span]:max-w-none [&>span]:overflow-visible [&>span]:whitespace-nowrap',
          compact && 'text-[11px]',
          className,
        )}
      >
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full ring-2 ring-background shadow-sm',
            config.dotClassName,
            'dark:bg-primary-foreground dark:ring-0',
          )}
        />
        <span>{text}</span>
      </Badge>
    </SoftTip>
  );
}

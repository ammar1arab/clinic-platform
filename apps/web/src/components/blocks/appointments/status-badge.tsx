'use client';

import { Badge } from '@/components/ui';
import { SoftTip } from '@/components/primitives';
import { cn } from '@/lib/utils';
import { STATUS_BADGE_VARIANT, STATUS_CONFIG } from '@/constants/appointment';
import type { AppointmentStatus } from '@/services/appointments.service';
export {
  STATUS_COLORS,
  STATUS_CONFIG,
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
  const config = STATUS_CONFIG[status];
  const text = compact ? config.short : config.label;

  return (
    <SoftTip label={tip ? config.label : undefined}>
      <Badge
        variant={STATUS_BADGE_VARIANT[status]}
        aria-label={config.label}
        className={cn(compact && 'text-[11px]', className)}
      >
        <span className={cn('size-1.5 shrink-0 rounded-full', config.dotClassName)} />
        <span>{text}</span>
      </Badge>
    </SoftTip>
  );
}

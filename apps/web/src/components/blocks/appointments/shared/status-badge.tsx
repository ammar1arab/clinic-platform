'use client';

import type { ReactNode } from 'react';
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
} from '@/constants/appointment';

type Props = {
  status: AppointmentStatus;
  className?: string;
  compact?: boolean;
  tip?: boolean;
  trailing?: ReactNode;
};

export function StatusBadgeBlock({
  status,
  className,
  compact,
  tip = true,
  trailing,
}: Props) {
  const { t } = useLanguage();
  const config = getStatusConfig(t)[status];
  const translatedLabel = config.label;

  return (
    <SoftTip label={tip ? translatedLabel : undefined}>
      <Badge
        variant={STATUS_BADGE_VARIANT[status]}
        aria-label={translatedLabel}
        className={cn(
          'max-w-none shrink-0 [&>span]:max-w-none [&>span]:overflow-visible [&>span]:whitespace-nowrap',
          compact && 'text-2xs',
          className,
        )}
      >
        <span
          className={cn(
            'size-1.5 shrink-0 rounded-full',
            config.dotClassName,
          )}
        />
        <span>{translatedLabel}</span>
        {trailing}
      </Badge>
    </SoftTip>
  );
}

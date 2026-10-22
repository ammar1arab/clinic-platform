'use client';

import type { ComponentProps } from 'react';
import {
  Badge,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { APPOINTMENT_EDITABLE_STATUSES, APPOINTMENT_STATUS_GROUPS } from '@clinic/types';
import { STATUS_GROUP_BADGE_VARIANT } from '@/constants/appointment';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/services/appointments.service';
import { StatusBadgeBlock } from './status-badge';
import { IconChevronDown, IconSpinner } from '@/constants/icons';
import { useLanguage } from '@/providers';

export function StatusMenuContent({ className, ...props }: ComponentProps<typeof DropdownMenuContent>) {
  return <DropdownMenuContent {...props} variant="status" className={cn('z-120', className)} />;
}

export function StatusMenuItems({
  options,
  value,
  onChange,
  title,
}: {
  options?: AppointmentStatus[];
  value: AppointmentStatus;
  onChange: (status: AppointmentStatus) => void;
  title?: string;
}) {
  const { t } = useLanguage();

  return (
    <DropdownMenuRadioGroup
      aria-label={title ?? t.appointments.updateStatus}
      value={value}
      onValueChange={(next) => onChange(next as AppointmentStatus)}
    >
      {(options ?? APPOINTMENT_EDITABLE_STATUSES).map((status, index) => (
        <DropdownMenuRadioItem
          key={status}
          value={status}
          disabled={status === value}
          style={{ animationDelay: `${index * 30}ms` }}
          className="cursor-pointer rounded-md px-2 py-1.5"
        >
          <StatusBadgeBlock status={status} tip={false} />
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

export function StatusFilterItems({
  active,
  onToggle,
}: {
  active: Set<AppointmentStatus>;
  onToggle: (status: AppointmentStatus) => void;
}) {
  const { t } = useLanguage();
  return Object.entries(APPOINTMENT_STATUS_GROUPS).map(([group, statuses], index) => {
    const selected = statuses.filter((status) => active.has(status)).length;
    return <DropdownMenuCheckboxItem
      key={group}
      style={{ animationDelay: `${index * 30}ms` }}
      checked={selected === statuses.length ? true : selected ? 'indeterminate' : false}
      onCheckedChange={(checked) => statuses.filter((status) => active.has(status) !== Boolean(checked)).forEach(onToggle)}
      onSelect={(event) => event.preventDefault()}
      className="gap-2 rounded-md px-2 py-1.5"
    >
      <Badge variant={STATUS_GROUP_BADGE_VARIANT[group as keyof typeof APPOINTMENT_STATUS_GROUPS]}>{t.appointments.statusGroups[group as keyof typeof APPOINTMENT_STATUS_GROUPS]}</Badge>
    </DropdownMenuCheckboxItem>;
  });
}

export function StatusPickerTrigger({
  status,
  disabled,
  pending,
  field,
  compact,
  className,
}: {
  status: AppointmentStatus;
  disabled?: boolean;
  pending?: boolean;
  field?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <DropdownMenuTrigger
      disabled={disabled}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md outline-none select-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        field &&
          'h-auto min-h-9 w-full justify-between border border-input bg-transparent px-2.5 py-2 hover:bg-muted/50 dark:bg-input/30',
        disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer',
        className,
      )}
    >
      <StatusBadgeBlock
        status={status}
        compact={compact}
        tip={false}
        className="shrink-0"
        trailing={pending ? (
          <IconSpinner aria-hidden className="size-3.5 shrink-0 animate-spin" />
        ) : disabled ? null : (
          <IconChevronDown aria-hidden className="size-3.5 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-180" />
        )}
      />
    </DropdownMenuTrigger>
  );
}

export function StatusFieldPicker({
  status,
  onChange,
}: {
  status: AppointmentStatus;
  onChange: (status: AppointmentStatus) => void;
}) {
  return (
    <DropdownMenu>
      <StatusPickerTrigger status={status} field />
      <StatusMenuContent align="start">
        <StatusMenuItems value={status} onChange={onChange} />
      </StatusMenuContent>
    </DropdownMenu>
  );
}

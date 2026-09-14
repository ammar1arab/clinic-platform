'use client';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { SCHEDULE_FILTER_STATUSES, STATUS_OPTIONS } from '@/constants/appointment';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/services/appointments.service';
import { StatusBadgeBlock } from './status-badge';
import { IconChevronDown, IconSpinner } from '@/constants/icons';
import { useLanguage } from '@/providers';

export const STATUS_MENU_CONTENT_CLASS = 'min-w-56 w-56';

export function StatusMenuItems({
  options = STATUS_OPTIONS,
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
      {options.map((status) => (
        <DropdownMenuRadioItem
          key={status}
          value={status}
          className="cursor-pointer rounded-md px-2 py-1.5"
        >
          <StatusBadgeBlock status={status} tip={false} />
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

export function StatusFilterItems({
  options = SCHEDULE_FILTER_STATUSES,
  active,
  onToggle,
}: {
  options?: AppointmentStatus[];
  active: Set<AppointmentStatus>;
  onToggle: (status: AppointmentStatus) => void;
}) {
  return (
    <>
      {options.map((status) => (
        <DropdownMenuCheckboxItem
          key={status}
          checked={active.has(status)}
          onCheckedChange={() => onToggle(status)}
          onSelect={(event) => event.preventDefault()}
          className="gap-2 rounded-md px-2 py-1.5"
        >
          <StatusBadgeBlock status={status} tip={false} />
        </DropdownMenuCheckboxItem>
      ))}
    </>
  );
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
      <StatusBadgeBlock status={status} compact={compact} tip={false} className="shrink-0" />
      {pending ? (
        <IconSpinner className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : disabled ? null : (
        <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]:rotate-180" />
      )}
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
      <DropdownMenuContent align="start" className={cn('z-120', STATUS_MENU_CONTENT_CLASS)}>
        <StatusMenuItems value={status} onChange={onChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

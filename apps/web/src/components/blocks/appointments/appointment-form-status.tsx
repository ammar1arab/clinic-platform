'use client';

import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { FormField } from '@/components/primitives';
import { STATUS_CONFIG, STATUS_OPTIONS } from '@/constants/appointment';
import { IconTimer } from '@/constants/icons';
import { formatWaitingMins } from '@/lib/waiting-time';
import type { AppointmentStatus } from '@/services/appointments.service';
import { StatusBadgeBlock } from './status-badge';
import { FormSection } from './appointment-form-controls';

export function AppointmentStatusFields({
  status,
  cancelReason,
  waitingMins,
  onStatusChange,
  onCancelReasonChange,
}: {
  status: AppointmentStatus;
  cancelReason: string;
  waitingMins: number | null;
  onStatusChange: (status: AppointmentStatus) => void;
  onCancelReasonChange: (reason: string) => void;
}) {
  return (
    <FormSection title="Status" action={<StatusBadgeBlock status={status} />}>
      <div className="space-y-3">
        <Select value={status} onValueChange={(value) => onStatusChange(value as AppointmentStatus)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option} textValue={STATUS_CONFIG[option].label}>
                <StatusBadgeBlock status={option} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {waitingMins != null && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Waiting time</span>
            <Badge variant="warning" className="tabular-nums">
              <IconTimer className="size-3" />
              {formatWaitingMins(waitingMins)}
            </Badge>
          </div>
        )}
        {status === 'cancelled' && (
          <FormField label="Cancellation Reason" required labelClassName="text-destructive">
            <Textarea
              value={cancelReason}
              onChange={(e) => onCancelReasonChange(e.target.value)}
              placeholder="Required when cancelling"
              rows={2}
              className="resize-none border-destructive/40"
            />
          </FormField>
        )}
      </div>
    </FormSection>
  );
}

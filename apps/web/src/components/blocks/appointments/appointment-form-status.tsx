'use client';

import { Badge, Textarea } from '@/components/ui';
import { FormField } from '@/components/primitives';
import { IconTimer } from '@/constants/icons';
import { formatWaitingMins } from '@/lib/waiting-time';
import type { AppointmentStatus } from '@/services/appointments.service';
import { FormSection } from './appointment-form-controls';
import { StatusFieldPicker } from './status-menu';
import { useLanguage } from '@/providers';

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
  const { t } = useLanguage();

  return (
    <FormSection title={t?.appointments?.status ?? 'Status'}>
      <div className="space-y-3">
        <StatusFieldPicker status={status} onChange={onStatusChange} />
        {waitingMins != null && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t?.appointments?.waitingTime ?? 'Waiting time'}
            </span>
            <Badge variant="warning" className="tabular-nums">
              <IconTimer className="size-3" />
              {formatWaitingMins(waitingMins, false, t)}
            </Badge>
          </div>
        )}
        {status === 'cancelled' && (
          <FormField
            label={t?.appointments?.cancellationReason ?? 'Cancellation Reason'}
            required
            labelClassName="text-destructive"
          >
            <Textarea
              value={cancelReason}
              onChange={(e) => onCancelReasonChange(e.target.value)}
              placeholder={t?.appointments?.requiredWhenCancelling ?? 'Required when cancelling'}
              rows={2}
              className="resize-none border-destructive/40"
            />
          </FormField>
        )}
      </div>
    </FormSection>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadgeBlock, STATUS_CONFIG, STATUS_OPTIONS } from './status-badge';
import { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { useUpdateAppointment } from '@/hooks/use-appointments';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { patientDisplayName } from './calendar-time';

interface Props {
  appointment: Appointment;
  onStatusChange?: (status: AppointmentStatus) => void;
  compact?: boolean;
  className?: string;
  disabled?: boolean;
}

export function AppointmentStatusSelect({
  appointment: appt,
  onStatusChange,
  compact = false,
  className,
  disabled = false,
}: Props) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState(false);

  const updateMutation = useUpdateAppointment();
  const isCancelled = appt.status === 'cancelled';
  const isPending = updateMutation.isPending;
  const isDisabled = disabled || isPending || isCancelled;

  const handleSelectStatus = (newStatus: string) => {
    if (newStatus === appt.status) return;
    if (isCancelled) return;

    if (newStatus === 'cancelled') {
      setCancelReason('');
      setCancelError(false);
      setCancelDialogOpen(true);
      return;
    }

    const targetStatus = newStatus as AppointmentStatus;
    onStatusChange?.(targetStatus);

    updateMutation.mutate(
      {
        id: appt.id,
        data: { status: targetStatus },
      },
      {
        onError: (err) => {
          toast.error(extractErrorMessage(err) || 'Failed to update status');
        },
      },
    );
  };

  const handleConfirmCancel = () => {
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setCancelError(true);
      return;
    }

    setCancelDialogOpen(false);
    onStatusChange?.('cancelled');

    updateMutation.mutate(
      {
        id: appt.id,
        data: {
          status: 'cancelled',
          cancelReason: trimmed,
        },
      },
      {
        onError: (err) => {
          toast.error(extractErrorMessage(err) || 'Failed to cancel appointment');
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isDisabled}
          className={cn(
            'group inline-flex items-center gap-1 rounded-md transition-all outline-none select-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            isCancelled
              ? 'cursor-not-allowed opacity-80'
              : 'cursor-pointer hover:opacity-85 hover:shadow-xs active:scale-[0.98]',
            className,
          )}
          title={
            isCancelled
              ? 'Cancelled appointments cannot be modified'
              : 'Click to change appointment status'
          }
        >
          <StatusBadgeBlock status={appt.status} compact={compact} />
          {isPending ? (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          ) : !isCancelled ? (
            <ChevronDown className="size-3 text-muted-foreground/80 transition-transform duration-150 group-data-[state=open]:rotate-180" />
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[120] w-44 p-1">
          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Update Status
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuRadioGroup value={appt.status} onValueChange={handleSelectStatus}>
            {STATUS_OPTIONS.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <DropdownMenuRadioItem
                  key={s}
                  value={s}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors"
                >
                  <span className={cn('size-2 shrink-0 rounded-full', cfg.dotClassName)} />
                  <span className="flex-1 font-medium">{cfg.label}</span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="z-[130] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling {patientDisplayName(appt)}&apos;s appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea
              autoFocus
              rows={3}
              placeholder="e.g. Patient requested reschedule, emergency..."
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError && e.target.value.trim()) setCancelError(false);
              }}
              className={cn(
                'resize-none text-xs',
                cancelError && 'border-destructive ring-2 ring-destructive/20',
              )}
            />
            {cancelError && (
              <p className="text-[11px] font-medium text-destructive">
                Cancellation reason is required.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleConfirmCancel}
            >
              {isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

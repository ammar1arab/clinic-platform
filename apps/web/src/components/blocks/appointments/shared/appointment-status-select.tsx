'use client';

import { useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@/components/ui';
import { SoftTip } from '@/components/primitives';
import { Appointment, AppointmentStatus } from '@/services/appointments.service';
import { useUpdateAppointment } from '@/hooks/api/use-appointments';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  STATUS_MENU_CONTENT_CLASS,
  StatusMenuItems,
  StatusPickerTrigger,
} from './status-menu';
import { useLanguage } from '@/providers';

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
  const { t } = useLanguage();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState(false);

  const updateMutation = useUpdateAppointment();
  const isCancelled = appt.status === 'cancelled';
  const isPending = updateMutation.isPending;
  const isDisabled = disabled || isPending || isCancelled;

  const handleSelectStatus = (newStatus: AppointmentStatus) => {
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
          onStatusChange?.(appt.status);
          toast.error(
            extractErrorMessage(err) || t.appointments.statusUpdateFailed,
          );
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
          onStatusChange?.(appt.status);
          toast.error(
            extractErrorMessage(err) || t.appointments.cancellationFailed,
          );
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <SoftTip
          label={
            isCancelled
              ? t.appointments.cannotModifyCancelled
              : t.appointments.clickToChangeStatus
          }
        >
          <StatusPickerTrigger
            status={appt.status}
            disabled={isDisabled}
            pending={isPending}
            compact={compact}
            className={className}
          />
        </SoftTip>
        <DropdownMenuContent align="end" className={cn('z-120', STATUS_MENU_CONTENT_CLASS)}>
          <StatusMenuItems
            value={appt.status}
            onChange={handleSelectStatus}
            title={t.appointments.updateStatus}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent preventClose={false} className="z-130 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.appointments.cancelAppointment}</DialogTitle>
            <DialogDescription>
              {t.appointments.cancelPrompt}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea
              autoFocus
              rows={3}
              placeholder={t.appointments.cancellationPlaceholder}
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
                {t.appointments.cancellationReasonRequired}
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
              {t.appointments.keepAppointment}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleConfirmCancel}
            >
              {isPending
                ? t.appointments.cancelling
                : t.appointments.confirmCancellation}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@/components/ui';
import { FormActions } from '@/components/primitives';
import { useLanguage } from '@/providers';

interface Props {
  open: boolean;
  name: string;
  destination: string;
  note: string;
  pending: boolean;
  closing: boolean;
  onNoteChange: (note: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function QueueMoveDialog({
  open,
  name,
  destination,
  note,
  pending,
  closing,
  onNoteChange,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useLanguage();
  const cancelReady = note.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{closing ? t.appointments.cancelAppointment : t.queue.moveTitle}</DialogTitle>
          <DialogDescription>{`${name} → ${destination}`}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!closing || cancelReady) onConfirm();
          }}
        >
          <Textarea
            aria-label={t.queue.moveNote}
            placeholder={closing ? t.appointments.cancellationReasonRequired : t.queue.moveNotePlaceholder}
            value={note}
            maxLength={500}
            rows={3}
            onChange={(event) => onNoteChange(event.target.value)}
          />
          {closing ? (
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
                {t.common.cancel}
              </Button>
              <Button type="submit" variant="destructive" disabled={pending || !cancelReady}>
                {t.appointments.cancelAppointment}
              </Button>
            </DialogFooter>
          ) : (
            <FormActions onCancel={onCancel} pending={pending} submitLabel={t.queue.moveConfirm} />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

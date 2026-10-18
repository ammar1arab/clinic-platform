'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from '@/components/ui';
import { ButtonSpinner } from '@/components/primitives/states/button-spinner';
import { FormField } from '@/components/primitives/forms/form-field';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/language-provider';

type FormActionsProps = {
  onCancel: () => void;
  submitLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  disabled?: boolean;

  variant?: 'page' | 'dialog';
  className?: string;

  onSubmitClick?: () => void;
};

export function FormActions({
  onCancel,
  submitLabel,
  cancelLabel,
  pending = false,
  disabled = false,
  variant = 'page',
  className,
  onSubmitClick,
}: FormActionsProps) {
  const { t } = useLanguage();
  const dialog = variant === 'dialog';

  return (
    <div
      className={cn(
        dialog
          ? 'contents'
          : 'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        className={cn(dialog && 'w-full sm:w-auto')}
        onClick={onCancel}
        disabled={pending}
      >
        {cancelLabel || t.common.cancel}
      </Button>
      <Button
        type={onSubmitClick ? 'button' : 'submit'}
        className={cn(dialog && 'w-full sm:w-auto')}
        disabled={pending || disabled}
        onClick={onSubmitClick}
      >
        {pending ? <ButtonSpinner /> : null}
        {submitLabel}
      </Button>
    </div>
  );
}

export function ReasonDialog({
  open,
  title,
  pending,
  withText,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  pending?: boolean;
  withText?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, text?: string) => void;
}) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  const [text, setText] = useState('');
  const reasonOk = reason.trim().length >= 3;
  const textOk = !withText || text.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {withText ? (
            <FormField label={t.visits.addendum} htmlFor="visit-addendum-text" required>
              <Textarea id="visit-addendum-text" value={text} onChange={(event) => setText(event.target.value)} rows={5} />
            </FormField>
          ) : null}
          <FormField label={t.visits.reason} htmlFor="visit-reason" required error={reason.trim().length > 0 && !reasonOk ? t.visits.reasonRequired : undefined}>
            <Input id="visit-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </FormField>
        </div>
        <DialogFooter>
          <FormActions
            variant="dialog"
            pending={pending}
            disabled={!reasonOk || !textOk}
            submitLabel={t.common.save}
            onCancel={() => onOpenChange(false)}
            onSubmitClick={() => onSubmit(reason.trim(), text.trim())}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

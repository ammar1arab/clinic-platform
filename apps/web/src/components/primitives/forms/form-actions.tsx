'use client';

import { Button } from '@/components/ui';
import { ButtonSpinner } from '@/components/primitives/states/button-spinner';
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

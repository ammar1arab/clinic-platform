'use client';

import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/blocks/feedback/button-spinner';
import { cn } from '@/lib/utils';

type FormActionsProps = {
  onCancel: () => void;
  submitLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  /** `page` = form footer row; `dialog` = joins DialogFooter flex via `contents` */
  variant?: 'page' | 'dialog';
  className?: string;
  /** Use type="button" submit when wrapping custom click handlers (dialogs). */
  onSubmitClick?: () => void;
};

/**
 * Consistent Cancel + primary action with pending spinner.
 */
export function FormActions({
  onCancel,
  submitLabel,
  cancelLabel = 'Cancel',
  pending = false,
  disabled = false,
  variant = 'page',
  className,
  onSubmitClick,
}: FormActionsProps) {
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
        {cancelLabel}
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

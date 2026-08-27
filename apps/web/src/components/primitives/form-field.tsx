import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormFieldProps = {
  label?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  hint?: string;
  className?: string;
  labelClassName?: string;
  children: ReactNode;
};



export function FormField({
  label,
  error,
  required,
  htmlFor,
  hint,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('min-w-0 space-y-1.5', className)}>
      {label != null && label !== '' ? (
        <Label htmlFor={htmlFor} className={labelClassName}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

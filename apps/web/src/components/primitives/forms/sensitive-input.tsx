'use client';

import { useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Button, Input } from '@/components/ui';
import { IconVisibleText, IconMaskedText } from '@/constants/icons';
import { useLanguage } from '@/providers';
import { cn } from '@/lib/utils';

export function SensitiveInput({
  type = 'text', ref, id, className, containerClassName, toggleClassName,
  children, onChange, ...props
}: ComponentProps<typeof Input> & {
  containerClassName?: string;
  toggleClassName?: string;
  children?: ReactNode;
}) {
  const { t } = useLanguage();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const input = useRef<HTMLInputElement | null>(null);
  const emailValidator = useRef<HTMLInputElement | null>(null);
  const [revealed, setRevealed] = useState(type !== 'password');
  const sensitive = type === 'password' || type === 'email';
  const label = revealed ? t.ui.hideValue : t.ui.showValue;

  const validateEmail = (element: HTMLInputElement) => {
    if (type !== 'email') return;
    const validator = emailValidator.current ?? document.createElement('input');
    validator.type = 'email';
    validator.value = element.value;
    emailValidator.current = validator;
    element.setCustomValidity(validator.validity.typeMismatch ? t.validation.email : '');
  };

  return (
    <div dir={props.dir} className={cn('relative min-w-0', containerClassName)}>
      <Input
        {...props}
        id={inputId}
        ref={(element) => {
          input.current = element;
          if (typeof ref === 'function') return ref(element);
          if (ref) ref.current = element;
        }}
        type={sensitive ? revealed ? type === 'password' ? 'text' : type : 'password' : type}
        inputMode={props.inputMode ?? (type === 'email' ? 'email' : undefined)}
        spellCheck={sensitive ? false : props.spellCheck}
        autoCapitalize={sensitive ? 'none' : props.autoCapitalize}
        className={cn(className, sensitive && 'pe-10')}
        onChange={(event) => {
          validateEmail(event.currentTarget);
          onChange?.(event);
        }}
      />
      {children}
      {sensitive ? (
        <span className={cn("absolute end-0.5 top-1/2 -translate-y-1/2", toggleClassName)}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={props.disabled}
            aria-label={label}
            aria-controls={inputId}
            aria-pressed={revealed}
            className="text-primary transition-colors hover:bg-primary/5 hover:text-primary active:not-aria-[haspopup]:translate-y-0 dark:hover:bg-primary/5"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => {
              const element = input.current;
              if (!element) return;
              validateEmail(element);
              const start = element.selectionStart;
              const end = element.selectionEnd;
              setRevealed((current) => !current);
              requestAnimationFrame(() => {
                const current = input.current;
                current?.focus({ preventScroll: true });
                if (current && type === 'password' && start !== null && end !== null) current.setSelectionRange(start, end);
              });
            }}
          >
            <span aria-hidden="true" className="relative size-4">
              <IconVisibleText className={cn("absolute inset-0 size-4 transition-opacity duration-(--motion-fast) motion-reduce:transition-none", revealed ? "opacity-100" : "opacity-0")} />
              <IconMaskedText className={cn("absolute inset-0 size-4 transition-opacity duration-(--motion-fast) motion-reduce:transition-none", revealed ? "opacity-0" : "opacity-100")} />
            </span>
          </Button>
        </span>
      ) : null}
    </div>
  );
}

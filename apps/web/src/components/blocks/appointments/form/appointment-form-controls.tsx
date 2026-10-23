'use client';

import type { ReactNode } from 'react';
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ReadOnlyMark, SearchablePicker, type PickerOption } from '@/components/primitives';
import { FORM_NONE, fromFormNone, toFormNone } from '@/constants/form';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers';

export function FormSection({
  title,
  action,
  contentClassName,
  children,
}: {
  title: string;
  action?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}

export function OptionalSelect({
  value,
  onChange,
  options,
  placeholder,
  noneLabel,
  searchPlaceholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  noneLabel?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <SearchablePicker
      options={options}
      value={toFormNone(value)}
      onChange={(next) => onChange(fromFormNone(next))}
      placeholder={placeholder ?? t.common.none}
      searchPlaceholder={searchPlaceholder ?? t.common.search}
      disabled={disabled}
      extraOption={{ value: FORM_NONE, label: noneLabel ?? t.common.none }}
      className="w-full"
    />
  );
}

export function ChoiceButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      disabled={disabled}
      onClick={onClick}
      className="h-auto w-full justify-center py-2.5"
    >
      {icon}
      {label}
    </Button>
  );
}

export function LockedValue({
  label,
  value,
  marked = false,
  inline = false,
  className,
}: {
  label: string;
  value: string;
  marked?: boolean;
  inline?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const text = value.trim();

  if (inline) {
    return (
      <div className={cn('flex h-8 min-w-0 items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-control dark:bg-input/30', className)}>
        <span className="shrink-0 text-muted-foreground">{label}</span>
        {text ? (
          <>
            <span className="shrink-0 text-muted-foreground">:</span>
            <span className="min-w-0 truncate text-foreground">{text}</span>
          </>
        ) : null}
        {marked ? <ReadOnlyMark label={t.common.readOnly} /> : null}
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {marked ? <ReadOnlyMark label={t.common.readOnly} /> : null}
      </div>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{text || '—'}</p>
    </div>
  );
}

export function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(muted && 'text-muted-foreground')}>{value}</span>
    </div>
  );
}

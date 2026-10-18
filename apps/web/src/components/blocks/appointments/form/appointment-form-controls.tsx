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
}: {
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  noneLabel?: string;
  searchPlaceholder?: string;
}) {
  const { t } = useLanguage();

  return (
    <SearchablePicker
      options={options}
      value={toFormNone(value)}
      onChange={(next) => onChange(fromFormNone(next))}
      placeholder={placeholder ?? t.common.none}
      searchPlaceholder={searchPlaceholder ?? t.common.search}
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

export function SegmentedToggle({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-border">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? 'default' : 'ghost'}
          size="sm"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className="rounded-none"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function LockedValue({
  label,
  value,
  marked = false,
  className,
}: {
  label: string;
  value: string;
  marked?: boolean;
  className?: string;
}) {
  const { t } = useLanguage();
  const text = value.trim();

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

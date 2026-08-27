'use client';

import type { ReactNode } from 'react';
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { FORM_NONE, fromFormNone, toFormNone } from '@/constants/form';
import { cn } from '@/lib/utils';

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
  placeholder = 'None',
  noneLabel = 'None',
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  noneLabel?: string;
  children: ReactNode;
}) {
  return (
    <Select value={toFormNone(value)} onValueChange={(next) => onChange(fromFormNone(next))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={FORM_NONE}>{noneLabel}</SelectItem>
        {children}
      </SelectContent>
    </Select>
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

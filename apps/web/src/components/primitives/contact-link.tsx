'use client';

import type { ReactNode } from 'react';
import {
  emailHref,
  formatEmailDisplay,
  formatPhoneDisplay,
  phoneHref,
} from '@/lib/contact';
import { cn } from '@/lib/utils';
import { SoftTip } from './soft-tip';

const linkClass =
  'truncate text-inherit underline-offset-2 hover:text-foreground hover:underline';

type ContactProps = {
  value?: string | null;
  className?: string;
  empty?: ReactNode;
  stopPropagation?: boolean;
};

export function PhoneLink({
  value,
  className,
  empty = '—',
  stopPropagation = true,
}: ContactProps) {
  const label = formatPhoneDisplay(value);
  const href = phoneHref(value);
  if (!label) return <span className={className}>{empty}</span>;
  if (!href) return <span className={cn('truncate', className)}>{label}</span>;
  return (
    <SoftTip label={label}>
      <a
        href={href}
        className={cn(linkClass, className)}
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        {label}
      </a>
    </SoftTip>
  );
}

export function EmailLink({
  value,
  className,
  empty = '—',
  stopPropagation = true,
}: ContactProps) {
  const label = formatEmailDisplay(value);
  const href = emailHref(value);
  if (!label) return <span className={className}>{empty}</span>;
  if (!href) return <span className={cn('truncate', className)}>{label}</span>;
  return (
    <SoftTip label={label}>
      <a
        href={href}
        className={cn(linkClass, className)}
        onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        {label}
      </a>
    </SoftTip>
  );
}

export function ContactLine({
  phone,
  email,
  className,
}: {
  phone?: string | null;
  email?: string | null;
  className?: string;
}) {
  const hasPhone = Boolean(formatPhoneDisplay(phone));
  const hasEmail = Boolean(formatEmailDisplay(email));
  if (!hasPhone && !hasEmail) {
    return <span className={className}>—</span>;
  }
  return (
    <p className={cn('flex min-w-0 flex-wrap items-center gap-x-1.5', className)}>
      {hasPhone ? <PhoneLink value={phone} empty="" /> : null}
      {hasPhone && hasEmail ? <span aria-hidden>·</span> : null}
      {hasEmail ? <EmailLink value={email} empty="" /> : null}
    </p>
  );
}

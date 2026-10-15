'use client';

import type { ReactNode } from 'react';
import {
  emailHref,
  formatEmailDisplay,
  formatPhoneDisplay,
  phoneHref,
} from '@/lib/contact';
import { CopyButton } from './copy-button';
import { cn } from '@/lib/utils';

const linkClass =
  'truncate text-inherit underline-offset-2 hover:text-foreground hover:underline';

type ContactProps = {
  value?: string | null;
  className?: string;
  empty?: ReactNode;
  stopPropagation?: boolean;
  copyable?: boolean;
};

function ContactLink({
  label,
  href,
  className,
  empty = '—',
  stopPropagation = true,
  copyable = false,
}: Omit<ContactProps, 'value'> & { label: string; href: string | null }) {
  if (!label) return <span className={className}>{empty}</span>;
  if (!href) return <span className={cn('truncate', className)}>{label}</span>;
  const link = (
    <a
      href={href}
      className={cn(linkClass, className)}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {label}
    </a>
  );
  return copyable ? (
    <span className="group/contact inline-flex max-w-full min-w-0 items-center gap-1">
      {link}
      <CopyButton value={label} />
    </span>
  ) : link;
}

export function PhoneLink({ value, ...props }: ContactProps) {
  return (
    <ContactLink
      {...props}
      label={formatPhoneDisplay(value)}
      href={phoneHref(value)}
    />
  );
}

export function EmailLink({ value, ...props }: ContactProps) {
  return (
    <ContactLink
      {...props}
      label={formatEmailDisplay(value)}
      href={emailHref(value)}
    />
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

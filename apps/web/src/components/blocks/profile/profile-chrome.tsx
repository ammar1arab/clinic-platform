'use client';

import type { ReactNode } from 'react';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { PageBack, SoftTip, TruncatedText } from '@/components/primitives';
import { cn } from '@/lib/utils';

export function ProfileShell({
  backHref,
  backLabel,
  actions,
  children,
}: {
  backHref: string;
  backLabel: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <PageBack backHref={backHref} backLabel={backLabel} actions={actions} />
      {children}
    </div>
  );
}

export function ProfileHero({
  avatar,
  title,
  titleExtra,
  subtitle,
  meta,
  badges,
  stats,
}: {
  avatar: ReactNode;
  title: string;
  titleExtra?: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  stats: { label: string; value: string }[];
}) {
  return (
    <Card className="card-aura overflow-hidden ring-0">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="shrink-0 self-start sm:self-center">{avatar}</div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="min-w-0 font-heading text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {titleExtra}
            {badges}
          </div>
          {subtitle ? (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
          {meta ? (
            <div className="text-sm text-muted-foreground">{meta}</div>
          ) : null}
        </div>
      </CardContent>
      {stats.length > 0 ? (
        <div
          className={cn(
            'grid border-t border-border/70',
            stats.length === 2 && 'grid-cols-2',
            stats.length === 3 && 'grid-cols-3',
            stats.length >= 4 && 'grid-cols-2 sm:grid-cols-4',
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-3 py-3.5 text-center sm:px-4"
            >
              <p className="text-lg font-semibold tabular-nums tracking-tight">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export function ProfileSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn('card-aura flex h-full flex-col ring-0', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-5 pb-3 pt-5">
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn('flex-1 px-5 pb-5', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

function hasDisplayValue(value?: string | null) {
  return Boolean(value?.trim());
}

export function ProfileInfoField({
  label,
  value,
  className,
  dir,
  children,
  hideEmpty = true,
}: {
  label: string;
  value?: string | null;
  className?: string;
  dir?: 'rtl' | 'ltr';
  children?: ReactNode;
  hideEmpty?: boolean;
}) {
  const filled = hasDisplayValue(value);
  if (hideEmpty && !filled && children == null) return null;

  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className="min-w-0 text-sm font-medium leading-snug text-foreground"
        dir={dir}
      >
        {children ?? (
          filled ? (
            <SoftTip label={value}>
              <span className="break-words">{value}</span>
            </SoftTip>
          ) : (
            '—'
          )
        )}
      </div>
    </div>
  );
}

export function ProfileInfoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ProfileGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-3">
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      ) : null}
      <ProfileInfoGrid>{children}</ProfileInfoGrid>
    </div>
  );
}

export function ProfileStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'secondary' : 'outline'} className="font-normal">
      {active ? 'Active' : 'Inactive'}
    </Badge>
  );
}

export function ProfileSoftRow({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
      <div className="min-w-0">
        <TruncatedText className="font-medium">{title}</TruncatedText>
        {detail ? (
          <TruncatedText className="text-xs text-muted-foreground">{detail}</TruncatedText>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ProfileEmpty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

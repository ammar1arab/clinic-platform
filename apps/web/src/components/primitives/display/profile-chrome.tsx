'use client';

import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { PageBack, TruncatedText } from '@/components/primitives';
import { EmptyState } from '../states/empty';
import { cn } from '@/lib/utils';

export function ProfileShell({
  backHref,
  actions,
  children,
}: {
  backHref: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-stack space-y-4">
      <PageBack backHref={backHref} actions={actions} />
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
      <CardContent className="flex flex-row items-center gap-3 p-4 sm:gap-5 sm:p-5">
        <div className="shrink-0">{avatar}</div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h1 className="min-w-0 truncate font-heading text-base font-semibold tracking-tight sm:text-lg">
              {title}
            </h1>
            {titleExtra}
            {badges}
          </div>
          {subtitle ? (
            <div className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</div>
          ) : null}
          {meta ? (
            <div className="text-xs text-muted-foreground sm:text-sm">{meta}</div>
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
            <div key={stat.label} className="px-2 py-2 text-center sm:px-3 sm:py-2.5">
              <p className="text-xs font-semibold tabular-nums tracking-tight sm:text-sm">
                {stat.value}
              </p>
              <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                {stat.label}
              </p>
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
  const fillHeight = Boolean(className?.includes('h-full'));

  return (
    <Card className={cn('card-aura flex flex-col ring-0', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
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
      <CardContent
        className={cn(
          'px-4 pb-4 sm:px-5 sm:pb-5',
          fillHeight && 'flex-1',
          contentClassName,
        )}
      >
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
    <div
      dir="ltr"
      className={cn(
        'flex items-center justify-between gap-3 py-2.5',
        'sm:flex-col sm:items-stretch sm:justify-start sm:gap-1 sm:py-0',
        className,
      )}
    >
      <p className="w-32 shrink-0 text-xs font-medium text-muted-foreground sm:w-auto">
        {label}
      </p>
      <div className={cn('flex min-w-0 flex-1 justify-end text-end text-sm font-medium leading-snug text-foreground sm:flex-none sm:justify-start sm:text-start', dir === 'rtl' && 'sm:justify-end sm:text-end')}>
        {children ? (
          <span dir={dir} className="min-w-0">
            {children}
          </span>
        ) : filled ? (
          <span dir={dir} className="break-words">
            {value}
          </span>
        ) : (
          '—'
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
        '-my-2.5 divide-y divide-border/70 sm:my-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 sm:divide-y-0',
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
          <TruncatedText className="text-xs text-muted-foreground">
            {detail}
          </TruncatedText>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ProfileEmpty({ children }: { children: ReactNode }) {
  return (
    <EmptyState
      icon={null}
      title={children}
      className="items-start gap-0 py-0 text-start [&>p]:font-normal [&>p]:text-muted-foreground"
    />
  );
}

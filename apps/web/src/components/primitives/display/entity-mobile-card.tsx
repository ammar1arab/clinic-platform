'use client';

import type { ReactNode } from 'react';
import { Switch } from '@/components/ui';
import { cn } from '@/lib/utils';

export function EntityMobileCard({
  title,
  subtitle,
  meta,
  active,
  onActiveChange,
  activeDisabled,
  actions,
  className,
  onClick,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  active?: boolean;
  onActiveChange?: (next: boolean) => void;
  activeDisabled?: boolean;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'rounded-xl bg-card p-3 ring-1 ring-foreground/10',
        onClick && 'cursor-pointer',
        active === false && 'opacity-60',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-sm font-semibold tracking-tight">{title}</div>
          {subtitle ? (
            <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
          ) : null}
        </div>
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {typeof active === 'boolean' && onActiveChange ? (
            <Switch
              checked={active}
              onCheckedChange={onActiveChange}
              disabled={activeDisabled}
            />
          ) : null}
          {actions}
        </div>
      </div>
      {meta ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t pt-2.5 text-xs sm:grid-cols-3">
          {meta}
        </div>
      ) : null}
    </div>
  );
}

export function EntityMetaStat({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  );
}

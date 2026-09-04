'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { MoreDotsIcon } from './more-dots-icon';
import { SoftTip } from './soft-tip';
import type { LucideIcon } from '@/constants/icons';

export type RowActionItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
};

function runSelect(onSelect?: () => void) {
  if (!onSelect) return;
  window.setTimeout(onSelect, 0);
}

export function RowActionsMenu({
  items,
  align = 'end',
  label = 'Actions',
}: {
  items: RowActionItem[];
  align?: 'start' | 'center' | 'end';
  label?: string;
}) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  const firstDestructive = visible.findIndex((item) => item.variant === 'destructive');

  return (
    <DropdownMenu modal={false}>
      <SoftTip label={label}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className="size-8 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
          >
            <MoreDotsIcon />
          </Button>
        </DropdownMenuTrigger>
      </SoftTip>
      <DropdownMenuContent align={align} className="min-w-44">
        {visible.map((item, index) => {
          const Icon = item.icon;
          return (
            <Fragment key={item.label}>
              {index === firstDestructive && firstDestructive > 0 ? (
                <DropdownMenuSeparator />
              ) : null}
              {item.href ? (
                <DropdownMenuItem variant={item.variant} disabled={item.disabled} asChild>
                  <Link href={item.href}>
                    {Icon ? <Icon /> : null}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant={item.variant}
                  disabled={item.disabled}
                  onSelect={() => runSelect(item.onSelect)}
                >
                  {Icon ? <Icon /> : null}
                  {item.label}
                </DropdownMenuItem>
              )}
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

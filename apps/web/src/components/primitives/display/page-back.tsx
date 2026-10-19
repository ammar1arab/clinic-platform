'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { IconArrowLeft, type LucideIcon } from '@/constants/icons';
import { IconWell, type IconWellAccent } from './icon-well';

interface Props {
  backHref: string;
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
  icon?: LucideIcon;
  accent?: IconWellAccent;
}

export function PageBack({
  backHref,
  search,
  actions,
  className,
  icon,
  accent,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href={backHref} prefetch>
          <IconArrowLeft className="size-3.5 me-1 rtl:rotate-180" />
          {t.ui.back}
        </Link>
      </Button>
      {icon ? <IconWell icon={icon} accent={accent} size="md" /> : null}
      {search ? <div className="min-w-0 flex-1">{search}</div> : null}
      {actions ? <div className={cn('shrink-0', !search && 'ms-auto')}>{actions}</div> : null}
    </div>
  );
}

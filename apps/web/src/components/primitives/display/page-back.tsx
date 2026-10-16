'use client';

import Link from 'next/link';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { IconArrowLeft, type LucideIcon } from '@/constants/icons';
import { IconWell, type IconWellAccent } from './icon-well';

interface Props {
  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  accent?: IconWellAccent;
  title?: string;
}

export function PageBack({
  backHref,
  actions,
  className,
  icon,
  accent,
  title,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2 h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href={backHref} prefetch>
            <IconArrowLeft className="size-3.5 me-1 rtl:rotate-180" />
            {t.ui.back}
          </Link>
        </Button>
        {icon ? <IconWell icon={icon} accent={accent} size="md" /> : null}
        {title ? (
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {title}
          </h2>
        ) : null}
      </div>
      {actions ? <div className="ms-auto shrink-0">{actions}</div> : null}
    </div>
  );
}

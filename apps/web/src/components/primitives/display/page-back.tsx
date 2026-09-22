'use client';

import Link from 'next/link';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { IconArrowLeft } from '@/constants/icons';

interface Props {
  backHref: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageBack({ backHref, backLabel, actions, className }: Props) {
  const { t } = useLanguage();

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href={backHref} prefetch>
          <IconArrowLeft className="size-3.5 me-1 rtl:rotate-180" />
          {backLabel ?? t.ui.back}
        </Link>
      </Button>
      {actions ? <div className="ms-auto shrink-0">{actions}</div> : null}
    </div>
  );
}

'use client';

import { useLanguage } from '@/providers/language-provider';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => router.push(backHref)}
      >
        <IconArrowLeft className="size-3.5 me-1 rtl:rotate-180" />
        {backLabel ?? t.ui.back}
      </Button>
      {actions}
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { Button, Card, CardContent, CardHeader } from '@/components/ui';
import { useLanguage } from '@/providers/language-provider';
import { cn } from '@/lib/utils';

export function SidePanel({
  title,
  headerActions,
  children,
  className,
  contentClassName,
  mobileSheet = false,
  open = true,
  onClose,
}: {
  title: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  mobileSheet?: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <Card
      size="sm"
      className={cn(
        'min-h-0 overflow-visible',
        mobileSheet && (open
          ? 'max-md:order-first max-md:border max-md:border-primary/50'
          : 'max-md:hidden'),
        className,
      )}
    >
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-2">
          {headerActions}
          {mobileSheet && open && onClose ? (
            <Button type="button" variant="ghost" size="sm" className="md:hidden" onClick={onClose}>
              {t.common.close}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn('min-h-0 space-y-4 overflow-y-auto', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import { useIsMobile } from '@/hooks/shared/use-media-query';
import { cn } from '@/lib/utils';

export function SidePanel({
  title,
  description,
  headerActions,
  children,
  className,
  contentClassName,
  mobileSheet = false,
  open = true,
  onClose,
}: {
  title: ReactNode;
  description?: string;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  mobileSheet?: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  const mobile = useIsMobile();
  if (mobileSheet && mobile) {
    return (
      <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
        <DialogContent preventClose={false} className="gap-4">
          <DialogHeader className="shrink-0 pe-8">
            <DialogTitle className="text-sm">{title}</DialogTitle>
            <DialogDescription className={description ? 'text-xs' : 'sr-only'}>{description ?? title}</DialogDescription>
          </DialogHeader>
          {headerActions}
          <div className={cn('min-h-0 space-y-4', contentClassName)}>{children}</div>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Card
      className={cn(
        'min-h-0 overflow-visible',
        mobileSheet && 'max-md:hidden',
        className,
      )}
    >
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2">
        <div className="min-w-0 space-y-1"><p className="text-sm font-semibold">{title}</p>{description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}</div>
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </CardHeader>
      <CardContent className={cn('min-h-0 space-y-4 overflow-y-auto pt-1 pb-2', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

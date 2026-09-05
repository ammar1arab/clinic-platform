'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui';
import { IconCheck, IconError, IconInfo, IconWarning } from '@/constants/icons';
import { cn } from '@/lib/utils';

const variants = {
  success: { icon: IconCheck, color: 'bg-success text-white' },
  error: { icon: IconError, color: 'bg-destructive text-white' },
  warning: { icon: IconWarning, color: 'bg-warning text-white' },
  info: { icon: IconInfo, color: 'bg-primary text-white' },
};

export function FeedbackOverlay({
  open,
  onClose,
  title,
  variant = 'success',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  variant?: keyof typeof variants;
}) {
  useEffect(() => {
    if (!open || variant !== 'success') return;
    const timer = window.setTimeout(onClose, 1400);
    return () => window.clearTimeout(timer);
  }, [open, variant, onClose]);

  const { icon: Icon, color } = variants[variant];

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent
        preventClose={false}
        showCloseButton={false}
        aria-label={title}
        className="items-center border-0 bg-transparent p-8 shadow-none ring-0 motion-reduce:animate-none"
      >
        <div
          className={cn(
            'relative grid size-24 place-items-center rounded-full shadow-lg motion-safe:animate-clinic-breathe',
            color,
          )}
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-current opacity-25 motion-safe:animate-clinic-ripple"
          />
          <Icon className="size-12" strokeWidth={2} aria-hidden />
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';
import { Dialog, DialogContent } from '@/components/ui';
import { IconCheck, IconError, IconInfo, IconWarning } from '@/constants/icons';
import { cn } from '@/lib/utils';

const variants = {
  success: { icon: IconCheck, color: 'bg-success text-primary-foreground' },
  error: { icon: IconError, color: 'bg-destructive text-primary-foreground' },
  warning: { icon: IconWarning, color: 'bg-warning text-primary-foreground' },
  info: { icon: IconInfo, color: 'bg-primary text-primary-foreground' },
};

function useAutoDismiss(enabled: boolean, onClose: () => void, ms = 1400) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!enabled) return () => {};
      const id = window.setTimeout(() => {
        onCloseRef.current();
        onStoreChange();
      }, ms);
      return () => window.clearTimeout(id);
    },
    [enabled, ms],
  );

  useSyncExternalStore(subscribe, () => enabled, () => false);
}

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
  useAutoDismiss(open && variant === 'success', onClose);

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

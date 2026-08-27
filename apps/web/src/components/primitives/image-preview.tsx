'use client';

import { useState, type ComponentProps, type SyntheticEvent } from 'react';
import {
  AvatarImage,
  EntityAvatar,
} from './entity-avatar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui';
import { resolveAvatarUrl } from '@/lib/avatars';

const ROW_CONTROL =
  'a, button, input, textarea, select, [role="switch"], [data-no-row-nav]';

export function isRowControlClick(e: { target: EventTarget | null }) {
  return e.target instanceof Element && Boolean(e.target.closest(ROW_CONTROL));
}

function stopRow(e: SyntheticEvent) {
  e.stopPropagation();
}

const LISTENERS = ['click', 'pointerdown', 'pointerup', 'mouseup'] as const;

function suppressClickThrough() {
  const until = Date.now() + 500;
  const block = (e: Event) => {
    if (Date.now() > until) {
      LISTENERS.forEach((type) => document.removeEventListener(type, block, true));
      return;
    }
    const target = e.target;
    if (
      target instanceof Element &&
      target.closest('[data-slot="dialog-content"], [data-slot="dialog-close"]')
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  };
  LISTENERS.forEach((type) => document.addEventListener(type, block, true));
  window.setTimeout(() => {
    LISTENERS.forEach((type) => document.removeEventListener(type, block, true));
  }, 500);
}

export function ImagePreview({
  src,
  alt = 'Preview',
  open,
  onOpenChange,
}: {
  src: string | null | undefined;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!src) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        suppressClickThrough();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="w-auto max-w-[min(100%-1.5rem,22rem)] gap-0 overflow-visible bg-transparent p-0 shadow-none ring-0 sm:max-w-88"
        showCloseButton
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.stopPropagation()}
        onInteractOutside={(e) => e.stopPropagation()}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative mx-auto aspect-square w-[min(calc(100vw-4rem),20rem)] overflow-hidden rounded-full bg-background ring-4 ring-background shadow-xl">
          <AvatarImage src={src} alt={alt} fill sizes="20rem" priority />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PreviewableAvatar(props: ComponentProps<typeof EntityAvatar>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        data-no-row-nav=""
        aria-label={`Preview ${props.alt}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          suppressClickThrough();
          setOpen(true);
        }}
        onPointerDown={stopRow}
        onMouseDown={stopRow}
        onPointerUp={stopRow}
        onDoubleClick={stopRow}
        onKeyDown={stopRow}
        className="shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <EntityAvatar {...props} />
      </button>
      <ImagePreview
        src={resolveAvatarUrl(props.src, props.seed)}
        alt={props.alt}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

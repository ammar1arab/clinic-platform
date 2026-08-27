'use client';

import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Spinner } from '@/components/primitives/spinner';
import { IconPerson, IconUpload } from '@/constants/icons';
import {
  ImageCompressError,
  uploadCompressedLocalImage,
} from '@/lib/image/upload-local';
import { cn } from '@/lib/utils';

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  fallbackLabel?: string;
  disabled?: boolean;
  className?: string;
  folder?: string;
};

export function AvatarUpload({
  value,
  onChange,
  fallbackLabel = 'DR',
  disabled,
  className,
  folder = 'practitioners',
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const initials = fallbackLabel.slice(0, 2).toUpperCase() || 'DR';
  const locked = disabled || busy;

  const onFile = async (file: File | undefined) => {
    if (!file || locked) return;
    setBusy(true);
    try {
      const { url } = await uploadCompressedLocalImage(file, {
        folder,
        maxBytes: 3 * 1024 * 1024,
        maxEdge: 1600,
        quality: 0.88,
      });
      onChange(url);
    } catch (err) {
      const message =
        err instanceof ImageCompressError || err instanceof Error
          ? err.message
          : 'Could not process image';
      toast.error(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('flex justify-center', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'relative inline-flex cursor-pointer rounded-full outline-none transition-transform active:scale-[0.98]',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          locked && 'pointer-events-none cursor-not-allowed opacity-60',
        )}
        aria-label={value ? 'Change photo' : 'Add photo'}
      >
        <Avatar
          className="pointer-events-none size-28 shadow-[0_8px_24px_color-mix(in_oklch,var(--color-foreground)_10%,transparent)] ring-4 ring-background"
          size="lg"
        >
          {value ? (
            <AvatarImage src={value} alt="" className="object-cover" />
          ) : null}
          <AvatarFallback
            className={cn(
              'bg-primary/12 text-xl font-semibold tracking-tight text-primary',
              !value && '[&>svg]:size-12 [&>svg]:opacity-80',
            )}
          >
            {value ? initials : <IconPerson aria-hidden />}
          </AvatarFallback>
          <AvatarBadge className="pointer-events-none size-8 border-0 bg-primary text-primary-foreground shadow-md [&>svg]:size-3.5">
            {busy ? (
              <Spinner className="size-3.5 text-primary-foreground" />
            ) : (
              <IconUpload aria-hidden />
            )}
          </AvatarBadge>
        </Avatar>

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={locked}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}

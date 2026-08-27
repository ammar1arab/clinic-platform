'use client';

import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { AvatarImage } from './entity-avatar';
import { ImagePreview } from './image-preview';
import { Spinner } from './spinner';
import {
  ImageCompressError,
  uploadCompressedLocalImage,
} from '@/lib/upload-local';
import { cn } from '@/lib/utils';
import { IconCamera, IconImage, IconUpload } from '@/constants/icons';

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  fallbackLabel?: string;
  disabled?: boolean;
  className?: string;
  alt?: string;
};

export function AvatarUpload({
  value,
  onChange,
  fallbackLabel = 'DR',
  disabled,
  className,
  alt = 'Photo',
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const initials = fallbackLabel.slice(0, 2).toUpperCase() || '?';
  const locked = disabled || busy;

  const pickFile = () => {
    if (locked) return;
    inputRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file || locked) return;
    setBusy(true);
    try {
      const { url } = await uploadCompressedLocalImage(file, {
        maxBytes: 3 * 1024 * 1024,
        maxEdge: 1600,
        quality: 0.88,
      });
      onChange(url);
      toast.message('Photo preview only', {
        description: 'Cloud storage is not connected yet, so this photo will not be saved.',
      });
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

  const face = (
    <span
      className={cn(
        'relative grid size-28 place-items-center overflow-hidden rounded-full',
        value
          ? 'bg-background ring-1 ring-border'
          : 'border-2 border-dashed border-primary/30 bg-primary/5',
      )}
    >
      {value ? (
        <AvatarImage
          src={value}
          alt=""
          width={112}
          height={112}
          sizes="112px"
          priority
        />
      ) : (
        <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <IconCamera className="size-5" aria-hidden />
        </span>
      )}
      {busy ? (
        <span className="absolute inset-0 grid place-items-center bg-background/55">
          <Spinner className="size-5 text-primary" />
        </span>
      ) : null}
    </span>
  );

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={locked}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {value ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={locked}
              aria-label="Photo options"
              className={cn(
                'group relative rounded-full outline-none transition-transform active:scale-[0.98]',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                locked && 'pointer-events-none cursor-not-allowed opacity-60',
              )}
            >
              {face}
              <span className="pointer-events-none absolute inset-0 rounded-full bg-foreground/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-aria-expanded:opacity-100" />
              <span className="pointer-events-none absolute inset-x-0 bottom-2.5 text-center text-[11px] font-medium text-primary-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-aria-expanded:opacity-100">
                Change
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-40">
            <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
              <IconImage />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={pickFile}>
              <IconUpload />
              Upload new
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          type="button"
          disabled={locked}
          aria-label="Add photo"
          onClick={pickFile}
          className={cn(
            'rounded-full outline-none transition-transform hover:scale-[1.02] active:scale-[0.98]',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            locked && 'pointer-events-none cursor-not-allowed opacity-60',
          )}
        >
          {face}
        </button>
      )}

      <p className="text-xs text-muted-foreground">
        {value ? 'Tap photo to preview or replace' : 'Add a photo'}
      </p>
      <span className="sr-only">{initials}</span>

      <ImagePreview
        src={value}
        alt={alt}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

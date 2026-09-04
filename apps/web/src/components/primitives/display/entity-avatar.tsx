'use client';

import { useState, type ComponentProps } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { IconSpinner } from '@/constants/icons';
import { defaultAvatarUrl, resolveAvatarUrl } from '@/lib/avatars';

const SIZE_PX = {
  sm: 24,
  default: 32,
  lg: 40,
  xl: 80,
} as const;

type Size = keyof typeof SIZE_PX;

function needsUnoptimized(src: string) {
  return (
    src.startsWith('blob:') ||
    src.startsWith('data:') ||
    src.startsWith('http://') ||
    src.startsWith('https://')
  );
}

export function AvatarImage({
  src,
  className,
  onLoad,
  onError,
  ...props
}: Omit<ComponentProps<typeof Image>, 'alt'> & { src: string }) {
  const [prev, setPrev] = useState(src);
  const [ready, setReady] = useState(false);
  if (src !== prev) {
    setPrev(src);
    setReady(false);
  }

  return (
    <>
      {!ready ? (
        <span className="absolute inset-0 grid place-items-center">
          <IconSpinner className="size-3 animate-spin text-muted-foreground" />
        </span>
      ) : null}
      <Image
        unoptimized={needsUnoptimized(src)}
        {...props}
        src={src}
        alt=""
        className={cn('size-full object-cover', !ready && 'opacity-0', className)}
        onLoad={(e) => {
          setReady(true);
          onLoad?.(e);
        }}
        onError={onError}
      />
    </>
  );
}

export function EntityAvatar({
  src,
  seed,
  size = 'default',
  priority = false,
  className,
}: {
  src?: string | null;
  seed: string;
  size?: Size;
  priority?: boolean;
  className?: string;
}) {
  const fallback = defaultAvatarUrl(seed);
  const resolved = resolveAvatarUrl(src, seed);
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setFailed(false);
  }
  const url = failed ? fallback : resolved;
  const px = SIZE_PX[size];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full bg-background ring-1 ring-border',
        size === 'sm' && 'size-6',
        size === 'default' && 'size-8',
        size === 'lg' && 'size-10',
        size === 'xl' && 'size-20',
        className,
      )}
    >
      <AvatarImage
        src={url}
        width={px}
        height={px}
        sizes={`${px}px`}
        priority={priority}
        onError={() => {
          if (url !== fallback) setFailed(true);
        }}
      />
    </span>
  );
}

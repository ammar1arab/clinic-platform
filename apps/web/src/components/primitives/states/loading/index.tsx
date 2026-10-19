'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { IconSpinner } from '@/constants/icons';
import { LoadingDots } from '@/components/primitives/display/brand-mark';
import { useClinicLogo } from '@/hooks/api/use-clinic';

function ClinicLoadingLogo({ size }: { size: 'md' | 'lg' }) {
  const logoUrl = useClinicLogo();
  const box = size === 'lg' ? 'size-20' : 'size-14';
  const px = size === 'lg' ? 64 : 48;

  if (!logoUrl) return <Spinner size="lg" />;

  return (
    <span className={cn('relative grid place-items-center', box)}>
      <span className="absolute inset-0 rounded-[1.4rem] border border-primary/15 bg-primary/5 animate-clinic-ripple" aria-hidden />
      <span className="absolute inset-1 rounded-[1.15rem] border border-border/70 bg-card" aria-hidden />
      <span className="relative grid size-[calc(100%-0.75rem)] place-items-center overflow-hidden rounded-2xl p-1.5 animate-clinic-breathe">
        <Image key={logoUrl} src={logoUrl} alt="" width={px} height={px} unoptimized className="max-h-full max-w-full object-contain" priority />
      </span>
    </span>
  );
}

export function Spinner({
  size = 'default',
  className,
}: {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) {
  const sizeMap = {
    sm: 'size-4',
    default: 'size-5',
    lg: 'size-6',
  } as const;
  
  return (
    <IconSpinner
      className={cn('animate-spin text-primary', sizeMap[size], className)}
      aria-hidden
    />
  );
}

export function InlineLoading({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground font-medium', className)}>
      <Spinner size="sm" />
      {text && <span>{text}</span>}
    </div>
  );
}

export function SectionLoader({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-14', className)}
      role="status"
      aria-live="polite"
    >
      <ClinicLoadingLogo size="md" />
      {label && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <LoadingDots />
        </div>
      )}
    </div>
  );
}

export function PageLoadingState({
  title,
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex min-h-80 w-full flex-col items-center justify-center gap-5 p-10 text-center animate-in fade-in-0 duration-200',
        className,
      )}
    >
      <ClinicLoadingLogo size="lg" />
      <div className="flex flex-col items-center gap-1.5">
        {title && (
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
        )}
        {description && (
          <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
        )}
        <LoadingDots className="mt-1" />
      </div>
    </div>
  );
}

export function LoadingState({
  variant = 'spinner',
  text,
  description,
  className
}: {
  variant?: 'spinner' | 'inline' | 'section' | 'page';
  text?: string;
  description?: string;
  className?: string;
}) {
  switch (variant) {
    case 'spinner':
      return <Spinner className={className} />;
    case 'inline':
      return <InlineLoading text={text} className={className} />;
    case 'section':
      return <SectionLoader label={text} className={className} />;
    case 'page':
      return <PageLoadingState title={text} description={description} className={className} />;
  }
}

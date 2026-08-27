import { cn } from '@/lib/utils';

export function MoreDotsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('animate-more-dots size-4', className)}
      aria-hidden
    >
      <circle cx="8" cy="3.2" r="1.35" />
      <circle cx="8" cy="8" r="1.35" />
      <circle cx="8" cy="12.8" r="1.35" />
    </svg>
  );
}

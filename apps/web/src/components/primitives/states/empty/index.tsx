import { cn } from '@/lib/utils';
import { IconFile, type LucideIcon } from '@/constants/icons';

export function EmptyState({
  icon: Icon = IconFile,
  title,
  description,
  action,
  className,
  iconClassName,
  iconContainerClassName,
  size = 'default',
  framed = true,
}: {
  icon?: LucideIcon | null;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  iconContainerClassName?: string;
  size?: 'inline' | 'compact' | 'default';
  framed?: boolean;
}) {
  const compact = size === 'compact';
  const inline = size === 'inline';

  return (
    <div
      role="status"
      className={cn(
        'empty-state-enter flex min-w-0 flex-col items-center justify-center gap-2 px-4 py-10 text-center',
        compact && 'gap-1 px-3 py-4',
        inline && 'flex-row justify-start gap-3 px-3 py-3 text-start',
        framed && !compact && !inline && 'rounded-xl border bg-card card-aura',
        className,
      )}
    >
      {Icon && (
        <div
          aria-hidden="true"
          dir="ltr"
          className={cn(
            'relative mb-3 h-28 w-40 shrink-0',
            compact && 'mb-1 h-16 w-22',
            inline && 'mb-0 size-10',
          )}
        >
          {inline ? (
            <span className={cn('empty-state-icon grid size-10 place-items-center rounded-xl border border-primary/10 bg-primary/8 text-primary', iconContainerClassName)}>
              <Icon className={cn('size-5', iconClassName)} strokeWidth={1.5} />
            </span>
          ) : <div className={cn('absolute left-0 top-0 h-32 w-44 origin-top-left', compact ? 'scale-50' : 'scale-[.9]')}>
            <svg viewBox="0 0 176 128" className="absolute inset-0 size-full fill-none">
              <ellipse className="empty-state-shadow fill-primary/8" cx="88" cy="113" rx="47" ry="5" />
              <path className="stroke-border" d="M14 114h14m120 0h14" strokeLinecap="round" />
              <path className="fill-muted/60 stroke-border" d="m35 79 15-27h76l15 27v17H35Z" strokeLinejoin="round" />
              <path className="stroke-border" d="M50 52v26m76-26v26" />
            </svg>
            <span className="absolute left-15 top-4 h-19 w-16 rotate-12 rounded-xl border border-primary/10 bg-primary/5" />
            <div className="empty-state-sheet absolute left-13 top-2 flex h-21 w-18 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card shadow-sm">
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-lg bg-primary/8 text-primary',
                  iconContainerClassName,
                )}
              >
                <Icon className={cn('size-5', iconClassName)} strokeWidth={1.5} />
              </span>
              <span className="h-1 w-9 rounded-full bg-border/80" />
              <span className="h-1 w-6 rounded-full bg-border/50" />
            </div>
            <svg viewBox="0 0 176 128" className="pointer-events-none absolute inset-0 size-full fill-none">
              <path className="fill-card stroke-border" d="M35 79h32l7 10h28l7-10h32v23a7 7 0 0 1-7 7H42a7 7 0 0 1-7-7Z" strokeLinejoin="round" />
              <path className="stroke-primary/30" d="M79 98h18" strokeLinecap="round" strokeWidth="2" />
              <path className="empty-state-spark stroke-accent-teal/70" d="M140 28v8m-4-4h8" strokeLinecap="round" strokeWidth="1.5" />
              <circle className="fill-primary/25" cx="31" cy="47" r="2" />
              <circle className="empty-state-spark fill-accent-teal/35" cx="149" cy="61" r="2" />
            </svg>
          </div>}
        </div>
      )}
      <div className={cn('min-w-0', !inline && 'contents')}>
        <p className={cn('text-base font-semibold tracking-tight text-foreground', (compact || inline) && 'text-sm')}>
          {title}
        </p>
        {description && (
          <p className={cn('max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground', inline && 'mt-0.5 text-xs')}>
            {description}
          </p>
        )}
        {action && <div className={cn('mt-4', (compact || inline) && 'mt-2')}>{action}</div>}
      </div>
    </div>
  );
}

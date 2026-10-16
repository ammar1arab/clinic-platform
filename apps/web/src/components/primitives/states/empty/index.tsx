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
}: {
  icon?: LucideIcon | null;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconClassName?: string;
  iconContainerClassName?: string;
  size?: 'default' | 'compact';
}) {
  const compact = size === 'compact';

  return (
    <div
      role="status"
      className={cn(
        'empty-state-enter relative flex min-w-0 flex-col items-center justify-center px-4 py-14 text-center',
        compact && 'gap-1 py-8',
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/5 via-transparent to-accent/10 blur-2xl" />

      {Icon && (
        <div
          aria-hidden="true"
          className={cn(
            'empty-state-art relative mb-5 grid size-28 shrink-0 place-items-center',
            compact && 'mb-3 size-20',
          )}
        >
          <span className="empty-state-halo absolute inset-0 rounded-full bg-gradient-to-br from-primary/18 via-primary/8 to-transparent shadow-[0_0_40px_rgba(var(--primary),0.15)]" />
          <span className="absolute inset-2 rounded-full border border-primary/10 bg-primary/5" />
          <span className="absolute inset-4 rounded-full border border-dashed border-border/60" />

          <span
            className={cn(
              'empty-state-icon empty-state-float relative z-10 grid size-16 place-items-center rounded-2xl border border-primary/20 bg-card/95 text-primary shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm',
              compact && 'size-12 rounded-xl',
              iconContainerClassName,
            )}
          >
            <Icon
              className={cn('size-7 drop-shadow-sm', compact && 'size-5', iconClassName)}
              strokeWidth={1.6}
            />
          </span>

          {!compact && (
            <>
              <span className="empty-state-float absolute end-3 top-4 size-2.5 rounded-full bg-accent-teal/70 shadow-[0_0_20px_rgba(45,212,191,0.6)] [animation-delay:-2s]" />
              <span className="empty-state-float absolute bottom-3 start-3 size-1.5 rounded-full bg-primary/50 [animation-delay:-4s]" />
              <span className="empty-state-float absolute bottom-6 end-6 size-1.5 rounded-full bg-primary/35 [animation-delay:-1s]" />
            </>
          )}
        </div>
      )}

      <div className="flex max-w-md flex-col items-center gap-2">
        <p
          className={cn(
            'text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl',
            compact && 'text-base',
          )}
        >
          {title}
        </p>

        {description && (
          <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div
          className={cn(
            'mt-5 w-full max-w-[220px] transition-all duration-300 ease-out',
            compact && 'mt-4',
          )}
        >
          <div className="inline-flex w-full items-center justify-center rounded-xl border border-border/60 bg-background/80 px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md">
            {action}
          </div>
        </div>
      )}
    </div>
  );
}
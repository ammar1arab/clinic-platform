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
        'empty-state-enter flex min-w-0 flex-col items-center justify-center gap-2 px-4 py-14 text-center',
        compact && 'gap-1 py-3',
        className,
      )}
    >
      {Icon && (
        <div
          aria-hidden="true"
          className={cn(
            'empty-state-art relative mb-3 grid size-28 shrink-0 place-items-center',
            compact && 'mb-1 size-16',
          )}
        >
          <span className="empty-state-halo absolute inset-1 rounded-full border border-primary/10 bg-primary/5" />
          {!compact && <span className="absolute inset-0 rounded-full border border-dashed border-border/60" />}
          <span
            className={cn(
              'empty-state-icon empty-state-float relative grid size-16 place-items-center rounded-2xl border border-primary/15 bg-card text-primary shadow-sm',
              compact && 'size-10 rounded-xl',
              iconContainerClassName,
            )}
          >
            <Icon className={cn('size-7', compact && 'size-5', iconClassName)} strokeWidth={1.5} />
          </span>
          {!compact && (
            <>
              <span className="empty-state-float absolute end-1 top-4 size-2 rounded-full bg-accent-teal/50 [animation-delay:-2s]" />
              <span className="empty-state-float absolute bottom-3 start-2 size-1.5 rounded-full bg-primary/35 [animation-delay:-4s]" />
            </>
          )}
        </div>
      )}
      <p className={cn('text-base font-semibold text-foreground', compact && 'text-sm')}>
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

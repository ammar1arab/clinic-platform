import { cn } from '@/lib/utils';
import { IconAdd, IconPackage, type LucideIcon } from '@/constants/icons';
import { Button } from '@/components/ui';

export function EmptyState({
  icon: Icon = IconPackage,
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
        'empty-state-enter relative flex w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-[28px] border border-border/70 bg-card/80 px-5 py-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-8 sm:py-10',
        compact && 'gap-2 rounded-2xl px-4 py-5',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_52%),radial-gradient(circle_at_bottom,_rgba(20,184,166,0.10),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-x-6 bottom-0 h-14 rounded-full bg-primary/5 blur-2xl" />

      {Icon && (
        <div
          aria-hidden="true"
          className={cn(
            'relative mb-2 grid place-items-center',
            compact ? 'size-16' : 'size-28',
          )}
        >
          <span className="empty-state-halo absolute inset-0 rounded-full border border-primary/10 bg-gradient-to-br from-primary/12 via-primary/4 to-transparent shadow-[0_0_40px_rgba(99,102,241,0.12)]" />
          <span className="absolute inset-3 rounded-full border border-dashed border-primary/10" />

          <span
            className={cn(
              'empty-state-icon relative z-10 grid place-items-center rounded-[26px] border border-primary/10 bg-gradient-to-br from-background to-card text-primary shadow-[0_20px_40px_rgba(15,23,42,0.08)]',
              compact ? 'size-12 rounded-2xl' : 'size-18 rounded-[28px]',
              iconContainerClassName,
            )}
          >
            <Icon
              className={cn('drop-shadow-sm', compact ? 'size-5' : 'size-9', iconClassName)}
              strokeWidth={1.6}
            />
          </span>

          {!compact && (
            <>
              <span className="empty-state-float absolute -end-1 top-5 size-2.5 rounded-full bg-accent-teal/80 shadow-[0_0_18px_rgba(45,212,191,0.5)]" />
              <span className="empty-state-float absolute start-1 bottom-3 size-1.5 rounded-full bg-primary/60 [animation-delay:-2s]" />
              <span className="empty-state-float absolute end-5 bottom-2 size-1.5 rounded-full bg-primary/40 [animation-delay:-4s]" />
            </>
          )}
        </div>
      )}

      <div className={cn('flex max-w-lg flex-col items-center', compact && 'gap-1')}>
        <h3
          className={cn(
            'font-semibold tracking-[-0.03em] text-foreground',
            compact ? 'text-base' : 'text-2xl sm:text-[2rem]',
          )}
        >
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              'max-w-md text-pretty text-muted-foreground',
              compact ? 'text-xs leading-relaxed' : 'mt-2 text-sm leading-7 sm:text-base',
            )}
          >
            {description}
          </p>
        )}
      </div>

      {action ? (
        <div className={cn('mt-3 w-full', compact ? 'max-w-[180px]' : 'max-w-[220px]')}>{action}</div>
      ) : (
        <Button
          type="button"
          className="mt-3 w-full max-w-[220px] justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_25px_rgba(99,102,241,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90"
          size={compact ? 'sm' : 'default'}
        >
          <IconAdd className="size-4" />
          Create new
        </Button>
      )}
    </div>
  );
}

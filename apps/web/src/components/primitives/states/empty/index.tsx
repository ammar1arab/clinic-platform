import { cn } from '@/lib/utils';
import { IconFile, type LucideIcon } from '@/constants/icons';

export function EmptyState({
  icon: Icon = IconFile,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center justify-center gap-2 px-4 py-14 text-center',
        className,
      )}
    >
      <div aria-hidden="true" className="relative mb-3 grid size-28 shrink-0 place-items-center">
        <span className="empty-state-halo absolute inset-1 rounded-full border border-primary/10 bg-primary/5" />
        <span className="absolute inset-0 rounded-full border border-dashed border-border/60" />
        <span className="empty-state-float relative grid size-16 place-items-center rounded-2xl border border-primary/15 bg-card text-primary shadow-sm">
          <Icon className="size-7" strokeWidth={1.5} />
        </span>
        <span className="empty-state-float absolute end-1 top-4 size-2 rounded-full bg-accent-teal/50 [animation-delay:-2s]" />
        <span className="empty-state-float absolute bottom-3 start-2 size-1.5 rounded-full bg-primary/35 [animation-delay:-4s]" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

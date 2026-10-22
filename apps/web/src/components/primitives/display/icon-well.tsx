import { cn } from '@/lib/utils';
import type { LucideIcon } from '@/constants/icons';

export type IconWellAccent =
  | 'default'
  | 'teal'
  | 'success'
  | 'warning'
  | 'error'
  | 'muted'
  | 'indigo'
  | 'violet'
  | 'pink'
  | 'orange'
  | 'cyan';

type IconWellSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<
  IconWellSize,
  { well: string; icon: string; radius: string }
> = {
  sm: { well: 'size-8', icon: 'size-3.5', radius: 'rounded-md' },
  md: { well: 'size-9', icon: 'size-4', radius: 'rounded-lg' },
  lg: { well: 'size-11', icon: 'size-5', radius: 'rounded-lg' },
};


const accentMap: Record<IconWellAccent, string> = {
  default: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/12',
  teal: 'bg-accent-teal/12 text-accent-teal ring-1 ring-inset ring-accent-teal/15',
  success: 'bg-success/12 text-success ring-1 ring-inset ring-success/15',
  warning: 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/20',
  error: 'bg-error/12 text-error ring-1 ring-inset ring-error/15',
  muted: 'bg-muted text-foreground ring-1 ring-inset ring-border/60',
  indigo: 'bg-info/12 text-info ring-1 ring-inset ring-info/15',
  violet: 'bg-accent-violet/12 text-accent-violet ring-1 ring-inset ring-accent-violet/15',
  pink: 'bg-accent-violet/12 text-accent-violet ring-1 ring-inset ring-accent-violet/15',
  orange: 'bg-warning/12 text-warning ring-1 ring-inset ring-warning/15',
  cyan: 'bg-accent-teal/12 text-accent-teal ring-1 ring-inset ring-accent-teal/15',
};

interface Props {
  icon: LucideIcon;
  size?: IconWellSize;
  accent?: IconWellAccent;
  className?: string;

  interactive?: boolean;
}


export function IconWell({
  icon: Icon,
  size = 'lg',
  accent = 'default',
  className,
  interactive = false,
}: Props) {
  const s = sizeMap[size];
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center transition-colors duration-200',
        s.well,
        s.radius,
        accentMap[accent],
        interactive &&
          'group-hover:bg-primary/12 group-hover:text-primary group-hover:ring-primary/15',
        className,
      )}
    >
      <Icon className={s.icon} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

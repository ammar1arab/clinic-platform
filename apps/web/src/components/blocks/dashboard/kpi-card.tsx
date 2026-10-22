import Link from 'next/link';
import { Button, Skeleton } from '@/components/ui';
import { IconCard, SoftTip, type IconWellAccent } from '@/components/primitives';
import { IconAdd, IconOpen, type LucideIcon } from '@/constants/icons';

interface Props {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  accent?: IconWellAccent;
  isLoading?: boolean;
  action?: { href: string; label: string; kind: 'add' | 'view' };
}

export function KpiCardBlock({
  label,
  value,
  icon,
  accent = 'default',
  isLoading = false,
  action,
}: Props) {
  return (
    <div className="relative">
      <IconCard
        icon={icon}
        accent={accent}
        title={
          isLoading || value === undefined || value === null ? (
            <Skeleton className="mb-1 h-6 w-14 rounded-md" />
          ) : (
            <span className="font-heading text-xl font-semibold tracking-tight tabular-nums leading-none">
              {value}
            </span>
          )
        }
        description={label}
        orientation="horizontal"
        compact
        className="cursor-default border border-border"
      />
      {action ? (
        <SoftTip label={action.label} className="absolute top-1.5 end-1.5">
          <Button asChild variant="ghost" size="icon-xs" className="rounded-full text-muted-foreground hover:text-primary">
            <Link href={action.href} aria-label={action.label}>
              {action.kind === 'add' ? <IconAdd /> : <IconOpen className="rtl:-scale-x-100" />}
            </Link>
          </Button>
        </SoftTip>
      ) : null}
    </div>
  );
}

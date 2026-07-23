import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: 'default' | 'success' | 'warning' | 'error';
}

const accentMap = {
  default: 'from-brand/20 to-accent-teal/15 text-primary',
  success: 'from-success/20 to-success/5 text-success',
  warning: 'from-warning/25 to-warning/5 text-warning',
  error: 'from-error/20 to-error/5 text-error',
};

export function KpiCardBlock({ label, value, icon: Icon, accent = 'default' }: Props) {
  return (
    <Card className="transition-transform duration-300 hover:-translate-y-0.5">
      <CardContent className="flex items-center gap-3.5 p-4 md:p-5">
        <div
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br shadow-sm',
            accentMap[accent],
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

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
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
};

export function KpiCardBlock({ label, value, icon: Icon, accent = 'default' }: Props) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('size-10 rounded-lg flex items-center justify-center flex-shrink-0', accentMap[accent])}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
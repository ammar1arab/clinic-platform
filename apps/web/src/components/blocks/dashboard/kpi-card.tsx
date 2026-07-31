import { Card, CardContent } from '@/components/ui/card';
import {
  IconWell,
  type IconWellAccent,
} from '@/components/primitives/icon-well';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: IconWellAccent;
}

export function KpiCardBlock({
  label,
  value,
  icon,
  accent = 'default',
}: Props) {
  return (
    <Card className="transition-transform duration-300 hover:-translate-y-0.5">
      <CardContent className="flex flex-col gap-3 p-4 md:p-5">
        <IconWell icon={icon} size="md" accent={accent} />
        <div className="min-w-0 space-y-0.5">
          <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums leading-none">
            {value}
          </p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

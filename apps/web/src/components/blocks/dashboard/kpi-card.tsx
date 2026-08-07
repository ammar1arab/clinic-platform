import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconWell,
  type IconWellAccent,
} from '@/components/primitives/icon-well';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: number | string | null | undefined;
  icon: LucideIcon;
  accent?: IconWellAccent;
  isLoading?: boolean;
}

export function KpiCardBlock({
  label,
  value,
  icon,
  accent = 'default',
  isLoading = false,
}: Props) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 active:scale-[0.99] cursor-default">
      <CardContent className="flex flex-col gap-3 p-4 md:p-5">
        <IconWell icon={icon} size="md" accent={accent} />
        <div className="min-w-0 space-y-1">
          {isLoading || value === undefined || value === null ? (
            <Skeleton className="h-7 w-16 rounded-md" />
          ) : (
            <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums leading-none">
              {value}
            </p>
          )}
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

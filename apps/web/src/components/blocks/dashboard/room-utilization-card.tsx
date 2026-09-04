import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui';
import { EmptyState } from '@/components/primitives';
import { RoomUtilization } from '@/services/dashboard.service';
import { cn } from '@/lib/utils';
import { IconRoom } from '@/constants/icons';
import { useLanguage } from '@/providers';
import { getBilingualName } from '@/i18n';

interface Props {
  rooms: RoomUtilization[] | undefined;
  isLoading: boolean;
}

function barColor(percent: number) {
  if (percent >= 80) return 'bg-error';
  if (percent >= 50) return 'bg-warning';
  return 'bg-success';
}

export function RoomUtilizationCardBlock({ rooms, isLoading }: Props) {
  const { t, lang } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{t.dashboard.roomUtilizationToday}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}

        {!isLoading && rooms?.length === 0 && (
          <EmptyState icon={IconRoom} title={t.settings.noRooms} className="py-6" />
        )}

        {rooms?.map((room) => {
          const displayName = getBilingualName(room.roomName, room.roomNameAr, lang);
          return (
            <div key={room.roomId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{displayName}</span>
                <span className="text-muted-foreground text-xs">{room.utilisationPercent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/80">
                <div
                  className={cn(
                    'h-full rounded-full shadow-[0_0_12px_-2px_currentColor] transition-all duration-700 ease-out',
                    barColor(room.utilisationPercent),
                  )}
                  style={{ width: `${Math.min(room.utilisationPercent, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

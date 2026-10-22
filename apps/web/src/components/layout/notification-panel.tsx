'use client';

import type { NotificationDTO } from '@clinic/types';
import { Button, Skeleton } from '@/components/ui';
import { EmptyState, ErrorState, SoftTip } from '@/components/primitives';
import {
  IconBell,
  IconCheckCheck,
  IconDelete,
} from '@/constants/icons';
import { NotificationTypeIcon } from '@/components/blocks/notifications/notification-detail-dialog';
import { useNow } from '@/hooks/shared/use-now';
import { notificationAge, notificationCopy } from '@/lib/notification-copy';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers';

type Props = {
  items: NotificationDTO[] | undefined;
  unread: number;
  error: boolean;
  onRetry: () => void;
  onOpen: (item: NotificationDTO) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
};

export function NotificationPanel({ items, unread, error, onRetry, onOpen, onMarkAllRead, onClear }: Props) {
  const { t, lang } = useLanguage();
  const now = useNow(60_000);

  return (
    <div className="flex max-h-[min(70dvh,32rem)] flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <h2 className="text-sm font-semibold">{t.notifications.title}</h2>
        <div className="flex items-center gap-0.5">
          <SoftTip label={t.notifications.markAllRead}>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t.notifications.markAllRead} disabled={!unread} onClick={onMarkAllRead}>
              <IconCheckCheck className="size-4" />
            </Button>
          </SoftTip>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t.notifications.clearAll}
            disabled={!items?.length}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onClear}
          >
            <IconDelete className="size-4" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {error && !items ? (
          <ErrorState onRetry={onRetry} className="py-8" />
        ) : !items ? (
          <div className="space-y-3 p-3">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={IconBell} title={t.notifications.empty} description={t.notifications.emptyDesc} size="compact" />
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((item) => {
              const copy = notificationCopy(item, t, lang);
              const isUnread = !item.readAt;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-start transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none',
                      isUnread && 'bg-primary/5',
                    )}
                  >
                    <NotificationTypeIcon type={item.type} className="mt-0.5 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-sm', isUnread ? 'font-semibold' : 'font-medium')}>{copy.title}</span>
                      {copy.body ? <span className="block truncate text-xs text-muted-foreground">{copy.body}</span> : null}
                      <span className="mt-0.5 block text-2xs text-muted-foreground/80">
                        {notificationAge(item.createdAt, t, lang, now)}
                      </span>
                    </span>
                    {isUnread ? <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-primary" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

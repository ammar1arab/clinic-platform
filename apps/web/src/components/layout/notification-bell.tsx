'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NotificationDTO } from '@clinic/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';
import { IconBell, IconDelete } from '@/constants/icons';
import { useNotifications } from '@/hooks/api/use-notifications';
import { ROUTES } from '@/constants/routes';
import { NotificationDetailDialog } from '@/components/blocks/notifications/notification-detail-dialog';
import { useLanguage } from '@/providers';
import { NotificationPanel } from './notification-panel';

const label = (count: number) => (count > 99 ? '99+' : String(count));

export function NotificationBell() {
  const { t } = useLanguage();
  const { query, items, unread, markRead, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [selected, setSelected] = useState<NotificationDTO | null>(null);
  const [seen, setSeen] = useState(unread);
  const [from, setFrom] = useState(unread);
  const [pulse, setPulse] = useState(0);

  if (unread !== seen) {
    setSeen(unread);
    setFrom(seen);
    if (unread > seen) setPulse((value) => value + 1);
  }

  const openItem = (item: NotificationDTO) => {
    if (!item.readAt) markRead.mutate(item.id);
    setOpen(false);
    setSelected(item);
  };

  const askClear = () => {
    setOpen(false);
    setConfirmClear(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={unread ? t.notifications.unreadLabel.replace('{count}', String(unread)) : t.notifications.openLabel}
            className="relative size-10 rounded-full"
          >
            {pulse > 0 ? (
              <svg key={pulse} aria-hidden viewBox="0 0 32 32" className="notif-ring pointer-events-none absolute inset-0 size-full overflow-visible text-primary">
                <path pathLength={1} d="M4 16A12 12 0 0 1 13 4.38L15 4.38L17 0.8L18.6 7.4L20 4.38A12 12 0 1 1 4 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
            <IconBell className="size-[1.125rem]" />
            {unread ? (
              <Badge variant="destructive" aria-hidden className="absolute -end-0.5 -top-0.5 h-[1.125rem] min-h-0 min-w-[1.125rem] border-transparent bg-destructive px-1 text-[0.625rem] leading-none text-primary-foreground shadow-none">
                <span className="notif-roll">
                  <span key={pulse} className={pulse > 0 && from !== unread ? 'notif-roll__strip notif-roll__strip--go' : 'notif-roll__strip'}>
                    {pulse > 0 && from !== unread ? <span>{label(from)}</span> : null}
                    <span>{label(unread)}</span>
                  </span>
                </span>
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} collisionPadding={12} className="w-[calc(100vw-1.5rem)] p-0 sm:w-96">
          <NotificationPanel
            items={items}
            unread={unread}
            error={query.isError}
            onRetry={() => void query.refetch()}
            onOpen={openItem}
            onMarkAllRead={() => markAllRead.mutate()}
            onClear={askClear}
          />
          <div className="border-t p-2">
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href={ROUTES.NOTIFICATIONS} onClick={() => setOpen(false)}>{t.notifications.viewAll}</Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <NotificationDetailDialog item={items?.find((item) => item.id === selected?.id) ?? selected} onClose={() => setSelected(null)} />

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <IconDelete />
            </AlertDialogMedia>
            <AlertDialogTitle>{t.notifications.clearTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.notifications.clearDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => clear.mutate()}>
              {t.notifications.clearAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

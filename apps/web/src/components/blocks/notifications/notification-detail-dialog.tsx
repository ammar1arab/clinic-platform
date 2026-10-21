'use client';

import Link from 'next/link';
import { createElement } from 'react';
import type { NotificationDTO } from '@clinic/types';
import {
  Badge, Button, Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui';
import {
  IconBell, IconCalendar, IconClinicalRecord, IconPatients, IconReferral,
  type LucideIcon,
} from '@/constants/icons';
import { notificationCopy, notificationHref } from '@/lib/notification-copy';
import { formatDateTime } from '@/lib/datetime';
import { useLanguage } from '@/providers';

const TYPE_ICONS: [string, LucideIcon][] = [
  ['appointment_', IconCalendar],
  ['schedule_request_', IconCalendar],
  ['queue_', IconPatients],
  ['referral_', IconReferral],
  ['documentation_', IconClinicalRecord],
];

export function NotificationTypeIcon({ type, className }: { type: string; className?: string }) {
  return createElement(TYPE_ICONS.find(([prefix]) => type.startsWith(prefix))?.[1] ?? IconBell, { className });
}

export function NotificationDetailDialog({ item, onClose }: {
  item: NotificationDTO | null;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = item ? notificationCopy(item, t, lang) : null;
  const href = item ? notificationHref(item) : null;
  const bodyAr = item?.payload?.bodyAr;
  const body = lang === 'ar' && typeof bodyAr === 'string' && bodyAr ? bodyAr : item?.body;

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      {item && copy ? (
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <span className="mb-1 grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <NotificationTypeIcon type={item.type} className="size-5" />
            </span>
            <DialogTitle className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{copy.title}</DialogTitle>
            <DialogDescription>{formatDateTime(item.createdAt, undefined, lang)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
            {copy.body && copy.body !== body ? <p className="text-muted-foreground">{copy.body}</p> : null}
            {body ? <p>{body}</p> : null}
          </div>
          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <Badge variant="muted">{item.readAt ? t.notifications.read : t.notifications.unread}</Badge>
            {href ? <Button asChild size="sm"><Link href={href} onClick={onClose}>{t.notifications.openRelated}</Link></Button> : null}
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

'use client';

import Link from 'next/link';
import type { NotificationDTO } from '@clinic/types';
import {
  Button, Dialog, DialogContent,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui';
import {
  IconBell, IconCalendar, IconCalendarClock, IconCheckCircle, IconClose, IconHourglass, IconLock, IconReferral, IconRotateCcw,
  type LucideIcon,
} from '@/constants/icons';
import { IconWell, type IconWellAccent } from '@/components/primitives';
import { notificationAction, notificationCopy, notificationDetails } from '@/lib/notification-copy';
import { useLanguage } from '@/providers';

const TYPE_APPEARANCE: Record<string, { icon: LucideIcon; accent: IconWellAccent }> = {
  appointment_booked: { icon: IconCalendar, accent: 'indigo' },
  appointment_rescheduled: { icon: IconCalendarClock, accent: 'indigo' },
  appointment_cancelled: { icon: IconClose, accent: 'error' },
  queue_patient_waiting: { icon: IconHourglass, accent: 'teal' },
  referral_created: { icon: IconReferral, accent: 'violet' },
  referral_accepted: { icon: IconCheckCircle, accent: 'success' },
  referral_rejected: { icon: IconClose, accent: 'error' },
  documentation_due_notice: { icon: IconHourglass, accent: 'warning' },
  documentation_locked_notice: { icon: IconLock, accent: 'muted' },
  schedule_request_pending: { icon: IconCalendarClock, accent: 'warning' },
  schedule_request_approved: { icon: IconCheckCircle, accent: 'success' },
  schedule_request_declined: { icon: IconClose, accent: 'error' },
  schedule_request_withdrawn: { icon: IconRotateCcw, accent: 'muted' },
};

export function NotificationTypeIcon({ type, className, size = 'sm' }: { type: string; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const appearance = TYPE_APPEARANCE[type] ?? { icon: IconBell, accent: 'muted' };
  return <IconWell icon={appearance.icon} accent={appearance.accent} size={size} className={className} />;
}

export function NotificationDetailDialog({ item, onClose }: {
  item: NotificationDTO | null;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const copy = item ? notificationCopy(item, t, lang) : null;
  const action = item ? notificationAction(item, t) : null;
  const details = item ? notificationDetails(item, t, lang) : [];
  const bodyAr = item?.payload?.bodyAr;
  const body = lang === 'ar' && typeof bodyAr === 'string' && bodyAr ? bodyAr : item?.body;
  const note = body && !details.some((row) => row.value === body) ? body : null;

  return (
    <Dialog open={!!item} onOpenChange={(open) => { if (!open) onClose(); }}>
      {item && copy ? (
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-center gap-3 text-start">
            <NotificationTypeIcon type={item.type} size="md" className="shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle className="break-words text-base [overflow-wrap:anywhere]">{copy.title}</DialogTitle>
            </div>
          </DialogHeader>
          <dl className="divide-y rounded-xl border bg-muted/30 text-sm">
            {details.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-3 py-2">
                <dt className="shrink-0 text-xs text-muted-foreground">{row.label}</dt>
                <dd className="min-w-0 truncate text-end font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
          {note ? <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">{note}</p> : null}
          {action ? (
            <DialogFooter>
              <Button asChild size="sm" className="w-full sm:w-auto"><Link href={action.href} onClick={onClose}>{action.label}</Link></Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

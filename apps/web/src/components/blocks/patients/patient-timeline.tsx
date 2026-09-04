'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge, Button } from '@/components/ui';
import { EmptyState, ProfileSection } from '@/components/primitives';
import { StatusBadgeBlock } from '@/components/blocks/appointments';
import { ROUTES } from '@/constants/routes';
import {
  computePayable,
  type AppointmentStatus,
  type DiscountType,
} from '@/services/appointments.service';
import type { PatientDetail } from '@/services/patients.service';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/datetime';
import {
  IconChevronRight, IconInPerson, IconOnline, IconPayment,
  IconPerson, IconReferral, IconRoom, IconService, IconTime, IconVisit,
} from '@/constants/icons';
import { useLanguage } from '@/providers';

const TIMELINE_PREVIEW = 12;

type TimelineKind = 'visit' | 'referral' | 'payment';

interface TimelineItem {
  id: string;
  kind: TimelineKind;
  at: Date;
  title: string;
  subtitle: string;
  status?: string;
  href?: string;
  meta?: { label: string; icon: typeof IconTime }[];
}

function buildTimeline(
  appointments: PatientDetail['appointments'],
  referrals: NonNullable<PatientDetail['referrals']>,
  t: ReturnType<typeof useLanguage>['t'],
): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const appt of appointments) {
    const meta: TimelineItem['meta'] = [
      { label: formatTime(appt.scheduledAt), icon: IconTime },
      { label: `Dr. ${appt.doctor.name}`, icon: IconPerson },
    ];
    if (appt.service?.name) {
      meta.push({ label: appt.service.name, icon: IconService });
    }
    if (appt.sessionType === 'online') {
      meta.push({ label: t?.appointments?.online, icon: IconOnline });
    } else if (appt.room?.name) {
      meta.push({ label: appt.room.name, icon: IconRoom });
    } else {
      meta.push({ label: t?.appointments?.inPerson, icon: IconInPerson });
    }

    items.push({
      id: `visit-${appt.id}`,
      kind: 'visit',
      at: new Date(appt.scheduledAt),
      title: appt.service?.name ?? t?.appointments?.consultation,
      subtitle: format(new Date(appt.scheduledAt), 'EEE, MMM d, yyyy'),
      status: appt.status,
      href: ROUTES.SCHEDULE_EDIT(appt.id),
      meta,
    });

    const { payable } = computePayable(
      appt.fee,
      appt.discount,
      appt.discountType as DiscountType | null,
    );

    if (appt.isPaid && appt.paidAt) {
      items.push({
        id: `payment-${appt.id}`,
        kind: 'payment',
        at: new Date(appt.paidAt),
        title: `${t?.patient?.paid} ${payable.toFixed(3)} JOD`,
        subtitle: [
          appt.paymentMethodRef?.name ?? appt.paymentMethod ?? null,
          appt.service?.name ?? t?.appointments?.consultation,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    } else if (payable > 0 && appt.status !== 'cancelled') {
      items.push({
        id: `unpaid-${appt.id}`,
        kind: 'payment',
        at: new Date(appt.scheduledAt),
        title: `${t?.patient?.unpaid} ${payable.toFixed(3)} JOD`,
        subtitle: appt.service?.name ?? t?.appointments?.consultation,
        status: 'unpaid',
      });
    }
  }

  for (const ref of referrals) {
    const typeLabel = ref.type === 'consultation'
      ? t?.referral?.consultation
      : t?.referral?.referral;
    items.push({
      id: `referral-${ref.id}`,
      kind: 'referral',
      at: new Date(ref.createdAt),
      title: `${typeLabel} · ${ref.status}`,
      subtitle: [
        ref.fromDoctor?.name ? `${t?.referral?.fromDr} ${ref.fromDoctor.name}` : null,
        ref.toDoctor?.name ? `${t?.referral?.toDr} ${ref.toDoctor.name}` : null,
        ref.reason,
      ]
        .filter(Boolean)
        .join(' · '),
      status: ref.urgency,
    });
  }

  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}

interface Props {
  appointments: PatientDetail['appointments'];
  referrals?: PatientDetail['referrals'];
}

export function PatientTimelineBlock({ appointments, referrals = [] }: Props) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(
    () => buildTimeline(appointments, referrals, t),
    [appointments, referrals, t],
  );
  const hiddenCount = Math.max(0, items.length - TIMELINE_PREVIEW);
  const visibleItems =
    expanded || hiddenCount === 0 ? items : items.slice(0, TIMELINE_PREVIEW);

  const visitCount = appointments.length;

  const KIND_META: Record<
    TimelineKind,
    { label: string; icon: typeof IconVisit; className: string }
  > = {
    visit: {
      label: t?.patient?.visit,
      icon: IconVisit,
      className: 'bg-muted text-foreground',
    },
    referral: {
      label: t?.referral?.referral,
      icon: IconReferral,
      className: 'bg-muted text-muted-foreground',
    },
    payment: {
      label: t?.patient?.payment,
      icon: IconPayment,
      className: 'bg-muted text-foreground',
    },
  };

  return (
    <ProfileSection
      title="Activity"
      description={`${visitCount} ${visitCount === 1 ? 'visit' : 'visits'} · referrals & payments`}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={IconVisit}
          title={'No activity yet'}
          description={'Visits, referrals, and payments will show here.'}
          className="py-8"
        />
      ) : (
        <>
          <ol className="space-y-2">
            {visibleItems.map((item) => {
            const meta = KIND_META[item.kind];
            const Icon = meta.icon;
            const isUnpaid = item.kind === 'payment' && item.status === 'unpaid';
            const body = (
              <div
                className={cn(
                  'group relative flex gap-3 rounded-xl bg-muted/35 p-3 transition-colors',
                  item.href && 'hover:bg-muted/55',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg',
                    isUnpaid
                      ? 'bg-warning/15 text-warning'
                      : meta.className,
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={isUnpaid ? 'warning' : 'outline'}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {isUnpaid ? 'Unpaid' : meta.label}
                        </Badge>
                        <p className="truncate text-sm font-semibold tracking-tight">
                          {item.title}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.kind === 'visit' && item.status && (
                        <StatusBadgeBlock
                          status={item.status as AppointmentStatus}
                        />
                      )}
                      {item.kind === 'referral' && item.status && (
                        <Badge variant="secondary" className="capitalize">
                          {item.status}
                        </Badge>
                      )}
                      {item.href && (
                        <IconChevronRight className="size-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      )}
                    </div>
                  </div>
                  {item.meta && item.meta.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.meta.map((m, i) => {
                        const MIcon = m.icon;
                        return (
                          <Badge
                            key={`${item.id}-m-${i}`}
                            variant="muted"
                            className="max-w-full font-medium"
                          >
                            <MIcon className="size-3 shrink-0 opacity-80" />
                            <span>{m.label}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
          </ol>
          {hiddenCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded
                ? 'Show less activity'
                : `Show ${hiddenCount} more item${hiddenCount === 1 ? '' : 's'}`}
              </Button>
          ) : null}
        </>
      )}
    </ProfileSection>
  );
}

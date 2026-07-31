'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/primitives/empty-state';
import { StatusBadgeBlock } from '@/components/blocks/appointments/status-badge';
import {
  IconInPerson,
  IconOnline,
  IconPayment,
  IconPerson,
  IconReferral,
  IconRoom,
  IconService,
  IconTime,
  IconVisit,
} from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import {
  computePayable,
  type AppointmentStatus,
  type DiscountType,
} from '@/services/appointments.service';
import type { PatientDetail } from '@/services/patients.service';
import { cn } from '@/lib/utils';

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

const KIND_META: Record<
  TimelineKind,
  { label: string; icon: typeof IconVisit; className: string }
> = {
  visit: {
    label: 'Visit',
    icon: IconVisit,
    className: 'bg-muted text-foreground',
  },
  referral: {
    label: 'Referral',
    icon: IconReferral,
    className: 'bg-muted text-muted-foreground',
  },
  payment: {
    label: 'Payment',
    icon: IconPayment,
    className: 'bg-muted text-foreground',
  },
};

function buildTimeline(
  appointments: PatientDetail['appointments'],
  referrals: NonNullable<PatientDetail['referrals']>,
): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const appt of appointments) {
    const meta: TimelineItem['meta'] = [
      { label: format(new Date(appt.scheduledAt), 'h:mm a'), icon: IconTime },
      { label: `Dr. ${appt.doctor.name}`, icon: IconPerson },
    ];
    if (appt.service?.name) {
      meta.push({ label: appt.service.name, icon: IconService });
    }
    if (appt.sessionType === 'online') {
      meta.push({ label: 'Online', icon: IconOnline });
    } else if (appt.room?.name) {
      meta.push({ label: appt.room.name, icon: IconRoom });
    } else {
      meta.push({ label: 'In person', icon: IconInPerson });
    }

    items.push({
      id: `visit-${appt.id}`,
      kind: 'visit',
      at: new Date(appt.scheduledAt),
      title: appt.service?.name ?? 'Consultation',
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
        title: `Paid ${payable.toFixed(3)} JOD`,
        subtitle: [
          appt.paymentMethodRef?.name ?? appt.paymentMethod ?? null,
          appt.service?.name ?? 'Consultation',
        ]
          .filter(Boolean)
          .join(' · '),
      });
    } else if (payable > 0 && appt.status !== 'cancelled') {
      items.push({
        id: `unpaid-${appt.id}`,
        kind: 'payment',
        at: new Date(appt.scheduledAt),
        title: `Unpaid ${payable.toFixed(3)} JOD`,
        subtitle: appt.service?.name ?? 'Consultation',
        status: 'unpaid',
      });
    }
  }

  for (const ref of referrals) {
    const typeLabel = ref.type === 'consultation' ? 'Consultation' : 'Referral';
    items.push({
      id: `referral-${ref.id}`,
      kind: 'referral',
      at: new Date(ref.createdAt),
      title: `${typeLabel} · ${ref.status}`,
      subtitle: [
        ref.fromDoctor?.name ? `From Dr. ${ref.fromDoctor.name}` : null,
        ref.toDoctor?.name ? `to Dr. ${ref.toDoctor.name}` : null,
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
  const items = useMemo(
    () => buildTimeline(appointments, referrals),
    [appointments, referrals],
  );

  const visitCount = appointments.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-sm">Activity</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {visitCount} visit{visitCount === 1 ? '' : 's'} · referrals & payments
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={IconVisit}
            title="No activity yet"
            description="Visits, referrals, and payments will show here."
            className="py-8"
          />
        ) : (
          <ol className="space-y-2.5">
            {items.map((item) => {
              const meta = KIND_META[item.kind];
              const Icon = meta.icon;
              const isUnpaid = item.kind === 'payment' && item.status === 'unpaid';
              const body = (
                <div
                  className={cn(
                    'group relative flex gap-3 rounded-xl border border-border/70 bg-card p-3 transition-colors',
                    item.href && 'hover:border-foreground/20 hover:bg-muted/30',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg',
                      isUnpaid
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : meta.className,
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            {isUnpaid ? 'Unpaid' : meta.label}
                          </Badge>
                          <p className="truncate text-sm font-semibold tracking-tight">
                            {item.title}
                          </p>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {item.kind === 'visit' && item.status && (
                          <StatusBadgeBlock status={item.status as AppointmentStatus} />
                        )}
                        {item.kind === 'referral' && item.status && (
                          <Badge variant="secondary" className="capitalize">
                            {item.status}
                          </Badge>
                        )}
                        {item.href && (
                          <ChevronRight className="size-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                        )}
                      </div>
                    </div>
                    {item.meta && item.meta.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.meta.map((m, i) => {
                          const MIcon = m.icon;
                          return (
                            <span
                              key={`${item.id}-m-${i}`}
                              className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              <MIcon className="size-3 shrink-0 opacity-80" />
                              <span className="truncate">{m.label}</span>
                            </span>
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
                    <Link href={item.href} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

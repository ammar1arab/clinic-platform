'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Button } from '@/components/ui';
import { EmptyState, ProfileSection } from '@/components/primitives';
import { StatusBadgeBlock } from '@/components/blocks/appointments';
import {
  doctorDisplayName,
  formatDoctorLabel,
} from '@/components/blocks/appointments/shared/appointment-display';
import { ROUTES } from '@/constants/routes';
import {
  computePayable,
  type AppointmentStatus,
  type DiscountType,
} from '@/services/appointments.service';
import type { PatientDetail } from '@/services/patients.service';
import { cn } from '@/lib/utils';
import { formatTime, formatWeekdayDate } from '@/lib/datetime';
import {
  IconChevronRight, IconInPerson, IconOnline, IconPayment,
  IconPerson, IconReferral, IconRoom, IconService, IconTime, IconVisit,
} from '@/constants/icons';
import { getBilingualName, type Translations } from '@/i18n';
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

function referralStatusLabel(status: string, t: Translations) {
  if (status === 'pending') return t.referral.pending;
  if (status === 'accepted') return t.referral.accepted;
  if (status === 'rejected') return t.referral.rejected;
  return status;
}

function buildTimeline(
  appointments: PatientDetail['appointments'],
  referrals: NonNullable<PatientDetail['referrals']>,
  t: Translations,
  lang: string,
): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const appt of appointments) {
    const serviceName = getBilingualName(appt.service?.name, appt.service?.nameAr, lang);
    const roomName = getBilingualName(appt.room?.name, appt.room?.nameAr, lang);
    const meta: TimelineItem['meta'] = [
      { label: formatTime(appt.scheduledAt, undefined, lang), icon: IconTime },
      { label: formatDoctorLabel(appt.doctor, { lang }), icon: IconPerson },
    ];
    if (serviceName) {
      meta.push({ label: serviceName, icon: IconService });
    }
    if (appt.sessionType === 'online') {
      meta.push({ label: t.appointments.online, icon: IconOnline });
    } else if (roomName) {
      meta.push({ label: roomName, icon: IconRoom });
    } else {
      meta.push({ label: t.appointments.inPerson, icon: IconInPerson });
    }

    items.push({
      id: `visit-${appt.id}`,
      kind: 'visit',
      at: new Date(appt.scheduledAt),
      title: serviceName || t.appointments.consultation,
      subtitle: formatWeekdayDate(appt.scheduledAt, undefined, lang),
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
        title: `${t.patient.paid} ${payable.toFixed(3)} JOD`,
        subtitle: [
          appt.paymentMethodRef?.name ?? appt.paymentMethod ?? null,
          serviceName || t.appointments.consultation,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    } else if (payable > 0 && appt.status !== 'cancelled') {
      items.push({
        id: `unpaid-${appt.id}`,
        kind: 'payment',
        at: new Date(appt.scheduledAt),
        title: `${t.patient.unpaid} ${payable.toFixed(3)} JOD`,
        subtitle: serviceName || t.appointments.consultation,
        status: 'unpaid',
      });
    }
  }

  for (const ref of referrals) {
    const typeLabel = ref.type === 'consultation'
      ? t.referral.consultation
      : t.referral.referral;
    items.push({
      id: `referral-${ref.id}`,
      kind: 'referral',
      at: new Date(ref.createdAt),
      title: `${typeLabel} · ${referralStatusLabel(String(ref.status), t)}`,
      subtitle: [
        ref.fromDoctor?.name
          ? `${t.referral.fromDr} ${doctorDisplayName(ref.fromDoctor, lang)}`
          : null,
        ref.toDoctor?.name
          ? `${t.referral.toDr} ${doctorDisplayName(ref.toDoctor, lang)}`
          : null,
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
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(
    () => buildTimeline(appointments, referrals, t, lang),
    [appointments, referrals, t, lang],
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
      label: t.patient.visit,
      icon: IconVisit,
      className: 'bg-muted text-foreground',
    },
    referral: {
      label: t.referral.referral,
      icon: IconReferral,
      className: 'bg-muted text-muted-foreground',
    },
    payment: {
      label: t.patient.payment,
      icon: IconPayment,
      className: 'bg-muted text-foreground',
    },
  };

  return (
    <ProfileSection
      title={t.patient.activity}
      description={`${visitCount} ${visitCount === 1 ? t.patient.visit : t.patient.visits} · ${t.patient.referralsAndPayments}`}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={IconVisit}
          title={t.patient.noActivity}
          description={t.patient.noActivityDesc}
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
                          {isUnpaid ? t.patient.unpaid : meta.label}
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
                        <Badge variant="secondary">
                          {item.status === 'normal'
                            ? t.referral.normal
                            : item.status === 'high'
                              ? t.referral.high
                              : item.status === 'urgent'
                                ? t.referral.urgent
                                : item.status}
                        </Badge>
                      )}
                      {item.href && (
                        <IconChevronRight className="size-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground rtl:rotate-180" />
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
                ? t.patient.showLessActivity
                : `${t.patient.showMore} ${hiddenCount} ${t.patient.moreItems}`}
              </Button>
          ) : null}
        </>
      )}
    </ProfileSection>
  );
}

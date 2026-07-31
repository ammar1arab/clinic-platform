'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Clock, DoorOpen, Maximize2, Stethoscope, UserRound, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadgeBlock } from './status-badge';
import { STATUS_COLORS } from './status-colors';
import { Appointment, computePayable } from '@/services/appointments.service';
import { formatApptTimeRange, patientDisplayName } from './calendar-time';
import {
  clickAnchor,
  placePopover,
  type AnchorRect,
  type PopoverPlacement,
} from './popover-position';
import { formatWaitingMins, resolveWaitingMins } from '@/lib/waiting-time';

const CARD_WIDTH = 300;
const CARD_HEIGHT_EST = 300;

export interface EventPreviewState {
  appointment: Appointment;
  x: number;
  y: number;
  anchor?: AnchorRect;
}

interface Props {
  preview: EventPreviewState;
  onClose: () => void;
  onExpand: (appointment: Appointment) => void;
}

function formatDayLabel(appt: Appointment) {
  const start = new Date(appt.scheduledAt);
  return start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function resolveAnchor(preview: EventPreviewState): AnchorRect {
  return clickAnchor(preview.x, preview.y, preview.anchor);
}

export function EventPreview({ preview, onClose, onExpand }: Props) {
  const { appointment: appt } = preview;
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [placement, setPlacement] = useState<PopoverPlacement>(() =>
    placePopover(resolveAnchor(preview), CARD_WIDTH, CARD_HEIGHT_EST),
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (appt.status !== 'waiting' && appt.status !== 'checked_in') return;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [appt.status]);

  useLayoutEffect(() => {
    const anchor = resolveAnchor(preview);
    const h = panelRef.current?.offsetHeight ?? CARD_HEIGHT_EST;
    const w = panelRef.current?.offsetWidth ?? CARD_WIDTH;
    const moreEl = document.querySelector('[data-calendar-popover="more"]');
    const avoid: AnchorRect[] = [];
    if (moreEl) {
      const r = moreEl.getBoundingClientRect();
      avoid.push({
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      });
    }
    setPlacement(placePopover(anchor, w, h, { avoid }));
  }, [preview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-calendar-popover]')) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    const onReposition = () => {
      const anchor = resolveAnchor(preview);
      const h = panelRef.current?.offsetHeight ?? CARD_HEIGHT_EST;
      const w = panelRef.current?.offsetWidth ?? CARD_WIDTH;
      const moreEl = document.querySelector('[data-calendar-popover="more"]');
      const avoid: AnchorRect[] = [];
      if (moreEl) {
        const r = moreEl.getBoundingClientRect();
        avoid.push({
          left: r.left,
          top: r.top,
          right: r.right,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        });
      }
      setPlacement(placePopover(anchor, w, h, { avoid }));
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    document.addEventListener('mousedown', onPointer, true);
    document.addEventListener('touchstart', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      document.removeEventListener('mousedown', onPointer, true);
      document.removeEventListener('touchstart', onPointer, true);
    };
  }, [onClose, preview]);

  const pricing = computePayable(appt.fee, appt.discount, appt.discountType);
  const accent = STATUS_COLORS[appt.status];
  const waitingMins = resolveWaitingMins({ ...appt, now });
  const style = {
    left: placement.left,
    top: placement.top,
    width: CARD_WIDTH,
  } as CSSProperties;

  if (!mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Appointment preview"
      data-calendar-popover="preview"
      data-side={placement.side}
      className="fixed z-[110] max-h-[min(70vh,24rem)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95 duration-150"
      style={style}
    >
      <div className="h-1 w-full" style={{ backgroundColor: accent }} aria-hidden />

      <div className="max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain p-3.5">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              {patientDisplayName(appt)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDayLabel(appt)} · {formatApptTimeRange(appt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StatusBadgeBlock status={appt.status} />
            <button
              type="button"
              aria-label="Close preview"
              onClick={onClose}
              className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/40 p-2.5 text-xs">
          <Row icon={<UserRound className="size-3.5" />} label="Doctor" value={appt.doctor.name} />
          {appt.service && (
            <Row
              icon={<Stethoscope className="size-3.5" />}
              label="Service"
              value={appt.service.name}
            />
          )}
          {appt.sessionType === 'online' ? (
            <Row
              icon={<Video className="size-3.5" />}
              label="Session"
              value={
                appt.meetingUrl ? (
                  <a
                    href={appt.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-primary underline-offset-2 hover:underline"
                  >
                    Join online session
                  </a>
                ) : (
                  'Online session'
                )
              }
            />
          ) : (
            appt.room && (
              <Row icon={<DoorOpen className="size-3.5" />} label="Room" value={appt.room.name} />
            )
          )}
          <Row
            icon={<Clock className="size-3.5" />}
            label="Details"
            value={`${appt.durationMins} min · ${pricing.payable.toFixed(3)} JOD`}
          />
          {waitingMins != null && (
            <Row
              icon={<Clock className="size-3.5" />}
              label="Waiting time"
              value={formatWaitingMins(waitingMins)}
            />
          )}
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={() => onExpand(appt)}>
            <Maximize2 className="mr-1.5 size-3.5" />
            Open appointment
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-background text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-foreground">{value}</p>
      </div>
    </div>
  );
}

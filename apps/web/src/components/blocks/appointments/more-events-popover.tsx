'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Appointment } from '@/services/appointments.service';
import { STATUS_COLORS } from './status-colors';
import { formatApptStartAmPm, patientDisplayName } from './calendar-time';
import {
  clickAnchor,
  placePopover,
  type AnchorRect,
  type PopoverPlacement,
} from './popover-position';

const CARD_WIDTH = 260;
const CARD_HEIGHT_EST = 240;

export interface MoreEventsState {
  date: Date;
  appointments: Appointment[];
  x: number;
  y: number;
  anchor?: AnchorRect;
}

interface Props {
  state: MoreEventsState;
  onClose: () => void;
  onSelect: (appointment: Appointment, x: number, y: number, anchor?: AnchorRect) => void;
}

function resolveAnchor(state: MoreEventsState): AnchorRect {
  return clickAnchor(state.x, state.y, state.anchor);
}


export function MoreEventsPopover({ state, onClose, onSelect }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [placement, setPlacement] = useState<PopoverPlacement>(() =>
    placePopover(resolveAnchor(state), CARD_WIDTH, CARD_HEIGHT_EST),
  );

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    const anchor = resolveAnchor(state);
    const h = panelRef.current?.offsetHeight ?? CARD_HEIGHT_EST;
    const w = panelRef.current?.offsetWidth ?? CARD_WIDTH;

    setPlacement(
      placePopover(anchor, w, h, { prefer: ['bottom', 'top', 'right', 'left'] }),
    );
  }, [state]);

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
      const anchor = resolveAnchor(state);
      const h = panelRef.current?.offsetHeight ?? CARD_HEIGHT_EST;
      const w = panelRef.current?.offsetWidth ?? CARD_WIDTH;
      setPlacement(
        placePopover(anchor, w, h, { prefer: ['bottom', 'top', 'right', 'left'] }),
      );
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
  }, [onClose, state]);

  const dayLabel = state.date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
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
      aria-label={`Appointments on ${dayLabel}`}
      data-calendar-popover="more"
      data-side={placement.side}
      className="fixed z-[100] flex max-h-[min(60vh,18rem)] w-[260px] flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 duration-100"
      style={style}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 px-2.5 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{dayLabel}</p>
          <p className="text-[10px] text-muted-foreground">
            {state.appointments.length} total
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      </div>

      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-1.5">
        {state.appointments.map((appt) => {
          const accent = STATUS_COLORS[appt.status];
          return (
            <li key={appt.id}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const target = e.currentTarget;
                  const r = target.getBoundingClientRect();
                  onSelect(appt, e.clientX, e.clientY, {
                    left: r.left,
                    top: r.top,
                    right: r.right,
                    bottom: r.bottom,
                    width: r.width,
                    height: r.height,
                  });
                }}
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-muted/80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                  {formatApptStartAmPm(appt)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
                  {patientDisplayName(appt)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
}

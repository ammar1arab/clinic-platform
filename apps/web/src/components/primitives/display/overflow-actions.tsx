"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { IconChevronLeft, IconChevronRight } from "@/constants/icons";
import { useResizeObserver } from "@/hooks/shared/use-resize-observer";
import { useLanguage } from "@/providers";

export function OverflowActions({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const { t, dir } = useLanguage();
  const row = useRef<HTMLElement | null>(null);
  const pan = useRef<{ pointerId: number; x: number; scrollLeft: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [overflow, setOverflow] = useState(false);
  const measure = useCallback((element: HTMLElement) => {
    row.current = element;
    setOverflow(element.scrollWidth - element.clientWidth > 1);
  }, []);
  const observe = useResizeObserver(measure);
  const measureContent = useCallback(
    (element: HTMLElement) => {
      if (element.parentElement) measure(element.parentElement);
    },
    [measure],
  );
  const observeContent = useResizeObserver(measureContent);
  const move = (direction: number) =>
    row.current?.scrollBy({
      left: direction * (dir === "rtl" ? -180 : 180),
      behavior: "smooth",
    });
  return (
    <div className="flex min-w-0 items-center gap-1">
      {overflow && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          aria-label={t.common.previous}
          onClick={() => move(-1)}
        >
          <IconChevronLeft className="size-4 rtl:rotate-180" />
        </Button>
      )}
      <div
        ref={observe}
        className="min-w-0 flex-1 touch-auto select-none overflow-x-auto scrollbar-none data-[panning=true]:cursor-grabbing"
        role="group"
        aria-label={label}
        onPointerDown={(event) => {
          suppressClick.current = false;
          if (event.pointerType !== 'mouse' || event.button !== 0 || !event.isPrimary) return;
          if (!(event.target instanceof Element) || event.target.closest('[data-drag-handle], input, textarea, select, [contenteditable=true]')) return;
          const element = event.currentTarget;
          if (element.scrollWidth - element.clientWidth <= 1) return;
          pan.current = { pointerId: event.pointerId, x: event.clientX, scrollLeft: element.scrollLeft, moved: false };
        }}
        onPointerMove={(event) => {
          const start = pan.current;
          if (!start || start.pointerId !== event.pointerId) return;
          const distance = event.clientX - start.x;
          if (!start.moved && Math.abs(distance) < 8) return;
          if (!start.moved) {
            start.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            event.currentTarget.dataset.panning = 'true';
          }
          event.preventDefault();
          event.currentTarget.scrollLeft = start.scrollLeft - distance;
        }}
        onPointerUp={(event) => {
          if (pan.current?.pointerId !== event.pointerId) return;
          suppressClick.current = pan.current.moved;
          pan.current = null;
          delete event.currentTarget.dataset.panning;
        }}
        onPointerCancel={(event) => {
          suppressClick.current = !!pan.current?.moved;
          pan.current = null;
          delete event.currentTarget.dataset.panning;
        }}
        onLostPointerCapture={(event) => {
          if (pan.current?.pointerId === event.pointerId) {
            suppressClick.current = pan.current.moved;
            pan.current = null;
          }
          delete event.currentTarget.dataset.panning;
        }}
        onPointerLeave={(event) => {
          if (!pan.current?.moved && pan.current?.pointerId === event.pointerId) pan.current = null;
        }}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }}
      >
        <div ref={observeContent} className="flex w-max min-w-full gap-2">
          {children}
        </div>
      </div>
      {overflow && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          aria-label={t.common.next}
          onClick={() => move(1)}
        >
          <IconChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      )}
    </div>
  );
}

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
        className="min-w-0 flex-1 overflow-x-auto scrollbar-none"
        role="group"
        aria-label={label}
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

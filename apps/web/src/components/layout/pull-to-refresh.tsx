"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/providers/confirm-provider";
import { useLanguage } from "@/providers/language-provider";
import { prepareFeedbackSound, playRefreshSound } from "@/lib/feedback-sound";
import { cn } from "@/lib/utils";

const THRESHOLD = 64;
const REFRESH_PARAM = "_cureva_refresh";

export function PullToRefresh({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const pathname = usePathname();
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;
  const [distance, setDistance] = useState(0);
  const [origin, setOrigin] = useState({ top: 0, left: 0, width: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const bind = useCallback(
    (root: HTMLDivElement | null) => {
      if (!root) return;
      setDistance(0);
      setRefreshing(false);
      const url = new URL(window.location.href);
      if (url.searchParams.has(REFRESH_PARAM)) {
        url.searchParams.delete(REFRESH_PARAM);
        window.history.replaceState(window.history.state, "", url);
      }
      let start: { x: number; y: number; target: Element } | null = null;
      let surface: HTMLElement | null = null;
      let originalTranslate = "";
      let originalTransition = "";
      let settleTimer: ReturnType<typeof setTimeout> | undefined;
      const restoreSurface = () => {
        clearTimeout(settleTimer);
        if (!surface) return;
        surface.style.translate = originalTranslate;
        surface.style.transition = originalTransition;
        surface = null;
      };
      const moveSurface = (offset: number, settle = false) => {
        if (!surface) return;
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        surface.style.transition =
          settle && !reduced
            ? "translate 220ms cubic-bezier(0.2, 0.8, 0.2, 1)"
            : "none";
        surface.style.translate = `0 ${offset}px`;
      };
      let pulled = 0;
      let locked = false;
      let armed = false;
      let disposed = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const atTop = (target: Element) => {
        for (
          let node: Element | null = target;
          node;
          node = node.parentElement
        ) {
          if (node.scrollTop > 1) return false;
          if (node === root) break;
        }
        return (document.scrollingElement?.scrollTop ?? 0) <= 1;
      };
      const reset = () => {
        moveSurface(0, true);
        clearTimeout(settleTimer);
        settleTimer = setTimeout(restoreSurface, 220);
        start = null;
        pulled = 0;
        armed = false;
        setDistance(0);
      };
      const begin = (event: TouchEvent) => {
        if (
          locked ||
          event.touches.length !== 1 ||
          !window.matchMedia("(pointer: coarse)").matches
        )
          return;
        reset();
        restoreSurface();
        const target = event.target;
        if (
          !(target instanceof Element) ||
          !target.closest("main") ||
          target.closest(
            'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="slider"], [draggable="true"], .fc-event',
          ) ||
          !atTop(target)
        )
          return;
        surface = target.closest<HTMLElement>("main");
        if (!surface) return;
        originalTranslate = surface.style.translate;
        originalTransition = surface.style.transition;
        const bounds = surface.getBoundingClientRect();
        setOrigin({ top: bounds.top, left: bounds.left, width: bounds.width });
        start = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
          target,
        };
      };
      const move = (event: TouchEvent) => {
        if (!start || locked) return;
        if (event.touches.length !== 1 || !atTop(start.target)) {
          reset();
          return;
        }
        const dy = event.touches[0].clientY - start.y;
        const dx = Math.abs(event.touches[0].clientX - start.x);
        if (dy < -8 || (dx > 8 && dx > Math.abs(dy))) {
          reset();
          return;
        }
        if (dy <= 0) return;
        if (!event.cancelable) {
          reset();
          return;
        }
        event.preventDefault();
        pulled = 104 * (1 - Math.exp(-dy / 120));
        moveSurface(pulled);
        const ready = pulled >= THRESHOLD;
        if (ready && !armed) {
          armed = true;
          try {
            navigator.vibrate?.(12);
          } catch {}
        }
        setDistance(pulled);
      };
      const finish = async () => {
        const ready = pulled >= THRESHOLD;
        reset();
        if (!ready || locked) return;
        locked = true;
        prepareFeedbackSound();
        if (root.querySelector('main form, main [contenteditable="true"]')) {
          const accepted = await confirmRef.current({
            title: t.common.reloadPage,
            description: t.common.refreshUnsaved,
            confirmLabel: t.common.reloadPage,
          });
          if (!accepted || disposed) {
            locked = false;
            return;
          }
        }
        if (disposed) return;
        if (!navigator.onLine) {
          toast.error(t.common.refreshOffline);
          locked = false;
          return;
        }
        clearTimeout(settleTimer);
        if (!surface) {
          surface = root.querySelector<HTMLElement>("main");
          if (surface) {
            originalTranslate = surface.style.translate;
            originalTransition = surface.style.transition;
          }
        }
        moveSurface(56, true);
        setRefreshing(true);
        playRefreshSound();
        try {
          navigator.vibrate?.([12, 35, 12]);
        } catch {}
        timer = setTimeout(() => {
          const next = new URL(window.location.href);
          next.searchParams.set(REFRESH_PARAM, String(Date.now()));
          window.location.replace(next.href);
        }, 180);
      };
      const end = (event: TouchEvent) => {
        if (pulled > 8 && event.cancelable) event.preventDefault();
        void finish();
      };
      root.addEventListener("touchstart", begin, {
        passive: true,
        capture: true,
      });
      root.addEventListener("touchmove", move, {
        passive: false,
        capture: true,
      });
      root.addEventListener("touchend", end, { passive: false, capture: true });
      root.addEventListener("touchcancel", reset, { capture: true });
      return () => {
        disposed = true;
        clearTimeout(timer);
        restoreSurface();
        root.removeEventListener("touchstart", begin, true);
        root.removeEventListener("touchmove", move, true);
        root.removeEventListener("touchend", end, true);
        root.removeEventListener("touchcancel", reset, true);
      };
    },
    [pathname, t],
  );
  const visible = distance > 0 || refreshing;
  const label = refreshing
    ? t.common.refreshing
    : distance >= THRESHOLD
      ? t.common.releaseToRefresh
      : t.common.pullToRefresh;

  return (
    <div ref={bind} className="contents">
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed z-50 flex justify-center"
        style={{ top: origin.top, left: origin.left, width: origin.width }}
      >
        <div
          className={cn(
            "grid size-8 place-items-center rounded-full bg-background/90 text-muted-foreground motion-safe:transition-[transform,opacity] motion-safe:duration-200",
            !visible && "opacity-0",
          )}
          style={{
            transform: `translateY(${visible ? Math.max(0, ((refreshing ? 56 : distance) - 32) / 2) : -32}px)`,
            opacity: visible
              ? Math.min(1, (refreshing ? 56 : distance) / 32)
              : 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn("size-6", refreshing && "motion-safe:animate-spin")}
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${refreshing ? 75 : Math.max(4, Math.min(90, (distance / THRESHOLD) * 90))} 100`}
              style={{
                transformOrigin: "center",
                transform: `rotate(${refreshing ? -90 : distance * 3 - 90}deg)`,
              }}
            />
          </svg>
          <span className="sr-only">{visible ? label : ""}</span>
        </div>
      </div>
    </div>
  );
}

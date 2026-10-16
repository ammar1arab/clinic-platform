"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/providers/confirm-provider";
import { useLanguage } from "@/providers/language-provider";
import { prepareFeedbackSound, playRefreshSound } from "@/lib/feedback-sound";
import { cn } from "@/lib/utils";

const THRESHOLD = 64;
const PULL_START_DISTANCE = 10;
const HOLD_DISTANCE = 60;
const SETTLE_MS = 280;
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
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const moveSurface = (offset: number, settle = false) => {
        if (!surface) return;
        surface.style.transition =
          settle && !reduced
            ? `translate ${SETTLE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
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
        settleTimer = setTimeout(restoreSurface, SETTLE_MS);
        start = null;
        pulled = 0;
        armed = false;
        setDistance(0);
      };
      const begin = (event: TouchEvent) => {
        if (locked) return;
        if (event.touches.length !== 1) {
          reset();
          return;
        }
        reset();
        restoreSurface();
        const touched = event.touches[0].target;
        const target =
          touched instanceof Element
            ? touched
            : touched instanceof Node
              ? touched.parentElement
              : null;
        if (!target || !root.contains(target)) return;
        const header = target.closest("[data-app-topbar]");
        if (
          (!header && !target.closest("main")) ||
          (header && target.closest('button, a, [role="button"]')) ||
          target.closest(
            'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="slider"], [draggable="true"], .fc-event',
          ) ||
          !atTop(target)
        )
          return;
        surface = header
          ? root.querySelector<HTMLElement>("main")
          : target.closest<HTMLElement>("main");
        if (!surface) return;
        prepareFeedbackSound();
        if (header && event.cancelable) event.preventDefault();
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
        if (dy <= 0) {
          pulled = 0;
          moveSurface(0);
          setDistance(0);
          return;
        }
        if (dy <= PULL_START_DISTANCE) return;
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
        if (locked) return;
        const ready = pulled >= THRESHOLD;
        reset();
        if (!ready) return;
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
            const bounds = surface.getBoundingClientRect();
            setOrigin({
              top: bounds.top,
              left: bounds.left,
              width: bounds.width,
            });
          }
        }
        moveSurface(HOLD_DISTANCE, true);
        setRefreshing(true);
        playRefreshSound();
        try {
          navigator.vibrate?.([12, 35, 12]);
        } catch {}
        timer = setTimeout(() => {
          const next = new URL(window.location.href);
          next.searchParams.set(REFRESH_PARAM, String(Date.now()));
          window.location.replace(next.href);
        }, 560);
      };
      const end = (event: TouchEvent) => {
        if (pulled > 8 && event.cancelable) event.preventDefault();
        void finish();
      };
      document.addEventListener("click", prepareFeedbackSound, {
        once: true,
        capture: true,
      });
      document.addEventListener("touchstart", begin, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchmove", move, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchend", end, {
        passive: false,
        capture: true,
      });
      document.addEventListener("touchcancel", reset, { capture: true });
      return () => {
        disposed = true;
        clearTimeout(timer);
        restoreSurface();
        document.removeEventListener("click", prepareFeedbackSound, true);
        document.removeEventListener("touchstart", begin, true);
        document.removeEventListener("touchmove", move, true);
        document.removeEventListener("touchend", end, true);
        document.removeEventListener("touchcancel", reset, true);
      };
    },
    [pathname, t],
  );
  const visible = distance > 0 || refreshing;
  const dragging = distance > 0 && !refreshing;
  const progress = Math.min(1, distance / THRESHOLD);
  const ready = distance >= THRESHOLD || refreshing;
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
            "grid size-11 place-items-center rounded-full border border-border bg-card text-primary",
            dragging
              ? "transition-none"
              : "motion-safe:transition-[transform,opacity] motion-safe:duration-300 motion-safe:ease-out",
            !visible && "opacity-0",
          )}
          style={{
            transform: `translateY(${visible ? Math.max(0, ((refreshing ? HOLD_DISTANCE : distance) - 44) / 2) : -44}px) scale(${visible ? (refreshing ? 1 : 0.84 + progress * 0.16) : 0.9})`,
            opacity: visible
              ? Math.min(1, (refreshing ? HOLD_DISTANCE : distance) / 36)
              : 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className={cn(
              "size-6",
              refreshing &&
                "motion-safe:animate-spin motion-safe:[animation-duration:700ms]",
            )}
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground/25"
            />
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
              className="motion-safe:transition-[stroke-dasharray] motion-safe:duration-75 motion-safe:ease-linear"
              style={{
                transformOrigin: "center",
                transform: `rotate(${refreshing ? -90 : distance * 3 - 90}deg)`,
              }}
            />
            {!ready && (
              <path
                d="M12 7v10m-4-4 4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="motion-safe:transition-transform motion-safe:duration-100"
                style={{ transform: `rotate(${progress * 180}deg)` }}
              />
            )}
            {ready && (
              <path
                d="M10 5h4v5h5v4h-5v5h-4v-5H5v-4h5z"
                fill="currentColor"
                className="origin-center scale-90 motion-safe:animate-pulse"
              />
            )}
          </svg>
          <span className="sr-only">{visible ? label : ""}</span>
        </div>
      </div>
    </div>
  );
}

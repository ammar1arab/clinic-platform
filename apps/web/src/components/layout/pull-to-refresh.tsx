"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { IconRotateCcw } from "@/constants/icons";
import { useConfirm } from "@/providers/confirm-provider";
import { useLanguage } from "@/providers/language-provider";
import { prepareFeedbackSound, playRefreshSound } from "@/lib/feedback-sound";
import { cn } from "@/lib/utils";

const THRESHOLD = 72;
const REFRESH_PARAM = "_cureva_refresh";

export function PullToRefresh({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const confirm = useConfirm();
  const pathname = usePathname();
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;
  const [distance, setDistance] = useState(0);
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
        start = null;
        pulled = 0;
        armed = false;
        setDistance(0);
      };
      const begin = (event: TouchEvent) => {
        reset();
        if (
          locked ||
          event.touches.length !== 1 ||
          !window.matchMedia("(pointer: coarse)").matches
        )
          return;
        const target = event.target;
        if (
          !(target instanceof Element) ||
          !target.closest("main") ||
          target.closest(
            'input, textarea, select, button, a, [contenteditable="true"], [role="dialog"], [role="slider"], .fc-event',
          ) ||
          !atTop(target)
        )
          return;
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
        if (dy <= 0 || dx > Math.max(12, dy)) {
          reset();
          return;
        }
        if (!event.cancelable) {
          reset();
          return;
        }
        event.preventDefault();
        pulled = Math.min(104, dy * 0.5);
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
      const end = () => {
        void finish();
      };
      root.addEventListener("touchstart", begin, { passive: true });
      root.addEventListener("touchmove", move, { passive: false });
      root.addEventListener("touchend", end);
      root.addEventListener("touchcancel", reset);
      return () => {
        disposed = true;
        clearTimeout(timer);
        root.removeEventListener("touchstart", begin);
        root.removeEventListener("touchmove", move);
        root.removeEventListener("touchend", end);
        root.removeEventListener("touchcancel", reset);
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
        className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-150 flex justify-center"
      >
        {visible && (
          <div
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg motion-safe:transition-transform motion-safe:duration-150"
            style={{
              transform: `translateY(${refreshing ? THRESHOLD : distance}px)`,
            }}
          >
            <IconRotateCcw
              aria-hidden
              className={cn(
                "size-5 text-primary",
                refreshing && "motion-safe:animate-spin",
              )}
              style={
                refreshing
                  ? undefined
                  : { transform: `rotate(${distance * 4}deg)` }
              }
            />
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

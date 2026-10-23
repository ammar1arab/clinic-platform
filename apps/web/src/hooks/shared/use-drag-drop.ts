'use client';

import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';

const START_DISTANCE = 6;
const TOUCH_HOLD_MS = 280;
const TOUCH_SLOP = 10;
const EDGE = 64;
const MAX_SPEED = 20;
const CLICK_GUARD_MS = 400;
const INTERACTIVE = 'button, a, input, textarea, select, [role="combobox"], [role="menuitem"]';

export type DragSize = { width: number; height: number };
export type DragState = DragSize & { id: string; zone: string | null };

type Options<T> = {
  canDrop: (item: T, zone: string) => boolean;
  onDrop: (item: T, zone: string, size: DragSize) => void;
  onReject?: (item: T, zone: string) => void;
};

function edgeSpeed(toStart: number, toEnd: number) {
  if (toStart < EDGE) return -Math.ceil(((EDGE - Math.max(toStart, 0)) / EDGE) * MAX_SPEED);
  if (toEnd < EDGE) return Math.ceil(((EDGE - Math.max(toEnd, 0)) / EDGE) * MAX_SPEED);
  return 0;
}

function scrollEdges(x: number, y: number) {
  for (const box of document.querySelectorAll<HTMLElement>('[data-drag-scroll]')) {
    const rect = box.getBoundingClientRect();
    if (box.dataset.dragScroll === 'x') {
      if (y < rect.top || y > rect.bottom || box.scrollWidth <= box.clientWidth) continue;
      const dx = edgeSpeed(x - rect.left, rect.right - x);
      if (dx) box.scrollBy(dx, 0);
    } else {
      if (x < rect.left || x > rect.right || box.scrollHeight <= box.clientHeight) continue;
      const dy = edgeSpeed(y - rect.top, rect.bottom - y);
      if (dy) box.scrollBy(0, dy);
    }
  }
}

/**
 * Pointer-based drag and drop. Mark a card with `bind(item, id)` and each
 * target with `zoneProps(name)`. Mouse drags start after a small move, touch
 * drags after a short hold so swipes still scroll. Containers marked with
 * `data-drag-scroll="x" | "y"` scroll while the card nears their edges.
 */
export function useDragDrop<T>({ canDrop, onDrop, onReject }: Options<T>) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const draggedAt = useRef(0);
  const active = useRef(false);

  const bind = (item: T, id: string) => ({
    ref: (node: HTMLElement | null) => {
      if (!node) return;
      const block = (event: Event) => {
        if (active.current && event.cancelable) event.preventDefault();
      };
      node.addEventListener('touchmove', block, { passive: false });
      node.addEventListener('contextmenu', block);
      return () => {
        node.removeEventListener('touchmove', block);
        node.removeEventListener('contextmenu', block);
      };
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      const target = event.target;
      if (event.button !== 0 || active.current) return;
      if (target instanceof Element && target.closest(INTERACTIVE)) return;

      const touch = event.pointerType !== 'mouse';
      const source = event.currentTarget;
      const startX = event.clientX;
      const startY = event.clientY;
      let x = startX;
      let y = startY;
      let rect = source.getBoundingClientRect();
      let ghost: HTMLElement | null = null;
      let zone: string | null = null;
      let over: string | null = null;
      let frame = 0;
      let hold = 0;

      const place = () => {
        if (!ghost) return;
        ghost.style.transform = `translate3d(${rect.left + x - startX}px, ${rect.top + y - startY}px, 0) rotate(1.5deg)`;
      };

      const tick = () => {
        scrollEdges(x, y);
        const hit = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-zone]');
        const name = hit?.dataset.dropZone ?? null;
        over = name;
        const next = name && canDrop(item, name) ? name : null;
        if (next !== zone) {
          zone = next;
          setDrag((current) => (current ? { ...current, zone: next } : current));
        }
        frame = requestAnimationFrame(tick);
      };

      const lift = () => {
        rect = source.getBoundingClientRect();
        const size = { width: rect.width, height: rect.height };
        ghost = source.cloneNode(true) as HTMLElement;
        ghost.classList.add('drag-ghost');
        ghost.style.width = `${size.width}px`;
        ghost.style.height = `${size.height}px`;
        document.body.appendChild(ghost);
        document.body.classList.add('is-dragging');
        active.current = true;
        if (touch) navigator.vibrate?.(8);
        place();
        setDrag({ id, zone: null, ...size });
        frame = requestAnimationFrame(tick);
      };

      const move = (moveEvent: globalThis.PointerEvent) => {
        x = moveEvent.clientX;
        y = moveEvent.clientY;
        if (ghost) return place();
        const distance = Math.hypot(x - startX, y - startY);
        if (touch) {
          if (distance > TOUCH_SLOP) stop();
          return;
        }
        if (distance >= START_DISTANCE) lift();
      };

      const stop = () => {
        window.clearTimeout(hold);
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        window.removeEventListener('keydown', escape);
      };

      const finish = (drop: boolean) => {
        stop();
        if (!ghost) return;
        ghost.remove();
        ghost = null;
        document.body.classList.remove('is-dragging');
        active.current = false;
        draggedAt.current = performance.now();
        const size = { width: rect.width, height: rect.height };
        setDrag(null);
        if (!drop) return;
        if (zone) onDrop(item, zone, size);
        else if (over) onReject?.(item, over);
      };

      const end = (endEvent: globalThis.PointerEvent) => finish(endEvent.type === 'pointerup');

      const escape = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === 'Escape') finish(false);
      };

      if (touch) hold = window.setTimeout(lift, TOUCH_HOLD_MS);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      window.addEventListener('keydown', escape);
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (performance.now() - draggedAt.current > CLICK_GUARD_MS) return;
      event.preventDefault();
      event.stopPropagation();
    },
  });

  const zoneProps = (zone: string) => ({ 'data-drop-zone': zone });

  return { drag, bind, zoneProps };
}

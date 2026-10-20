'use client';

import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';

const START_DISTANCE = 6;
const INTERACTIVE = 'button, a, input, textarea, select, [role="combobox"], [role="menuitem"]';

export type DragSize = { width: number; height: number };
export type DragState = DragSize & { id: string; zone: string | null };

type Options<T> = {
  canDrop: (item: T, zone: string) => boolean;
  onDrop: (item: T, zone: string, size: DragSize) => void;
  onReject?: (item: T, zone: string) => void;
};

/**
 * Pointer-based drag and drop. Mark a card with `bind(item, id)` and each
 * target with `zoneProps(name)`. `drag` tells the UI what is being dragged,
 * where it hovers and how big it is, so a target can reserve matching space.
 */
export function useDragDrop<T>({ canDrop, onDrop, onReject }: Options<T>) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const justDragged = useRef(false);

  const bind = (item: T, id: string) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      const target = event.target;
      if (event.button !== 0 || event.pointerType === 'touch') return;
      if (target instanceof Element && target.closest(INTERACTIVE)) return;

      const source = event.currentTarget;
      const rect = source.getBoundingClientRect();
      const size = { width: rect.width, height: rect.height };
      const startX = event.clientX;
      const startY = event.clientY;
      let ghost: HTMLElement | null = null;
      let zone: string | null = null;
      let over: string | null = null;

      const move = (moveEvent: globalThis.PointerEvent) => {
        if (!ghost) {
          if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < START_DISTANCE) return;
          ghost = source.cloneNode(true) as HTMLElement;
          ghost.classList.add('drag-ghost');
          ghost.style.width = `${size.width}px`;
          ghost.style.height = `${size.height}px`;
          document.body.appendChild(ghost);
          document.body.classList.add('is-dragging');
          setDrag({ id, zone: null, ...size });
        }
        const x = rect.left + moveEvent.clientX - startX;
        const y = rect.top + moveEvent.clientY - startY;
        ghost.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(1.5deg)`;

        const hit = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest<HTMLElement>('[data-drop-zone]');
        const name = hit?.dataset.dropZone;
        over = name ?? null;
        const next = name && canDrop(item, name) ? name : null;
        if (next === zone) return;
        zone = next;
        setDrag((current) => (current ? { ...current, zone: next } : current));
      };

      const end = (endEvent: globalThis.PointerEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
        if (!ghost) return;
        ghost.remove();
        document.body.classList.remove('is-dragging');
        justDragged.current = true;
        setTimeout(() => {
          justDragged.current = false;
        }, 0);
        setDrag(null);
        if (endEvent.type !== 'pointerup') return;
        if (zone) onDrop(item, zone, size);
        else if (over) onReject?.(item, over);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (!justDragged.current) return;
      event.preventDefault();
      event.stopPropagation();
    },
  });

  const zoneProps = (zone: string) => ({ 'data-drop-zone': zone });

  return { drag, bind, zoneProps };
}

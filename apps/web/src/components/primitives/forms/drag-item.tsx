'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export function DragItem({ label, children, disabled, onPick, onDrop, className, variant = 'outline' }: {
  variant?: 'outline' | 'ghost';
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onPick?: () => void;
  onDrop: (target: string) => void;
  className?: string;
}) {
  const origin = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const frame = useRef<number | null>(null);
  const scope = useRef<HTMLElement | null>(null);
  const suppressClick = useRef(false);
  const bind = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    return () => {
      target.current?.removeAttribute('data-drag-over');
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const clear = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    target.current?.removeAttribute('data-drag-over');
    target.current = null;
    origin.current = null;
    setPosition(null);
  };
  return (
    <>
      <Button
        ref={bind}
        data-drag-handle=""
        type="button" variant={variant} disabled={disabled} aria-label={label}
        className={cn('touch-none select-none justify-start gap-3 cursor-grab active:cursor-grabbing motion-reduce:transition-none', className)}
        onClick={() => { if (!suppressClick.current) onPick?.(); suppressClick.current = false; }}
        onPointerDown={(event) => {
          if (event.button !== 0 || disabled) return;
          suppressClick.current = false;
          scope.current = event.currentTarget.closest<HTMLElement>('[data-drag-scope]');
          origin.current = { x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = origin.current;
          if (!start) return;
          if (!start.moved && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) return;
          start.moved = true;
          if (frame.current !== null) cancelAnimationFrame(frame.current);
          const { clientX: x, clientY: y } = event;
          frame.current = requestAnimationFrame(() => {
          frame.current = null;
          setPosition({ x, y });
          const found = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-target]') ?? null;
          const next = !scope.current || (found && scope.current.contains(found)) ? found : null;
          let scrollArea: HTMLElement | null = next;
          while (scrollArea) {
            if (scrollArea.scrollHeight > scrollArea.clientHeight && /auto|scroll/.test(getComputedStyle(scrollArea).overflowY)) {
              const bounds = scrollArea.getBoundingClientRect();
              if (y < bounds.top + 40) scrollArea.scrollTop -= 12;
              if (y > bounds.bottom - 40) scrollArea.scrollTop += 12;
              break;
            }
            scrollArea = scrollArea.parentElement;
          }
          if (next !== target.current) {
            target.current?.removeAttribute('data-drag-over');
            target.current = next;
            next?.setAttribute('data-drag-over', 'true');
          }
          });
        }}
        onPointerUp={(event) => {
          if (!origin.current) return;
          const moved = origin.current?.moved;
          const found = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-drop-target]');
          const destination = found && (!scope.current || scope.current.contains(found)) ? found.dataset.dropTarget : undefined;
          suppressClick.current = !!moved;
          clear();
          if (moved) {
            event.preventDefault();
            if (destination) onDrop(destination);
          }
        }}
        onKeyDown={(event) => { if (event.key === 'Escape') { suppressClick.current = true; clear(); } }}
        onPointerCancel={clear}
        onLostPointerCapture={clear}
      >{children}</Button>
      {position ? createPortal(
        <div aria-hidden className="pointer-events-none fixed z-50 max-w-64 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-primary bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg" style={{ left: position.x, top: position.y }}>{label}</div>,
        document.body,
      ) : null}
    </>
  );
}

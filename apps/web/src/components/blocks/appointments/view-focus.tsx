'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface ViewFocusApi {
  focused: boolean;
  enter: () => void;
  exit: () => void;
  toggle: () => void;
}

const ViewFocusContext = createContext<ViewFocusApi | null>(null);

/** True when the nearest ViewFocus shell is in focus (full-page) mode. */
export function useViewFocused() {
  return useContext(ViewFocusContext)?.focused ?? false;
}

/** Focus controls for header toggles — null outside a ViewFocus shell. */
export function useViewFocusControls() {
  return useContext(ViewFocusContext);
}

type FocusRender = (focused: boolean) => ReactNode;

interface ViewFocusProps {
  label: string;
  children: ReactNode | FocusRender;
  className?: string;
}

function isFocusRender(children: ReactNode | FocusRender): children is FocusRender {
  return typeof children === 'function';
}

/** Compact header control — place inside calendar / timeline / queue headers. */
export function ViewFocusToggle({ className }: { className?: string }) {
  const api = useViewFocusControls();
  if (!api || api.focused) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={api.enter}
      title="Focus view"
      aria-label="Focus view"
      className={cn(
        'size-8 shrink-0 rounded-lg border-border/70 bg-background/80 text-muted-foreground shadow-2xs',
        'hover:border-primary/40 hover:bg-card hover:text-foreground active:scale-95',
        className,
      )}
    >
      <Maximize2 className="size-3.5" />
    </Button>
  );
}

/**
 * Full-page focus shell. Keeps one React tree via fixed positioning.
 * Put `<ViewFocusToggle />` in each view header — no floating overlay button.
 */
export function ViewFocus({ label, children, className }: ViewFocusProps) {
  const [focused, setFocused] = useState(false);

  const enter = useCallback(() => setFocused(true), []);
  const exit = useCallback(() => setFocused(false), []);
  const toggle = useCallback(() => setFocused((v) => !v), []);

  useKeyboardShortcut('escape', exit, { enabled: focused, ignoreInputs: false });

  const api = useMemo(
    () => ({ focused, enter, exit, toggle }),
    [focused, enter, exit, toggle],
  );

  const content = isFocusRender(children) ? children(focused) : children;

  return (
    <ViewFocusContext.Provider value={api}>
      {focused ? <div className="h-[min(72vh,40rem)] w-full" aria-hidden /> : null}

      <div
        data-view-focus={focused ? 'true' : undefined}
        className={cn(
          focused
            ? [
                'fixed inset-0 z-200 flex flex-col overflow-hidden overscroll-none bg-background',
                'animate-in fade-in-0 zoom-in-[0.985] duration-300 ease-out',
              ]
            : cn('relative', className),
        )}
      >
        {focused ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-card/95 px-3 py-2 backdrop-blur-md sm:px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {label}
              </p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Press Esc to exit focus
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exit}
              className="shrink-0 gap-1.5 active:scale-95"
              aria-label={`Exit focus · ${label}`}
            >
              <Minimize2 className="size-3.5" />
              Exit focus
            </Button>
          </div>
        ) : null}

        <div
          className={cn(
            'min-h-0 min-w-0',
            focused && 'flex flex-1 flex-col overflow-hidden overscroll-contain p-2 sm:p-3 md:p-4',
          )}
        >
          {content}
        </div>
      </div>
    </ViewFocusContext.Provider>
  );
}

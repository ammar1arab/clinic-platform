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
import { useSidebar } from '@/providers/sidebar-provider';

interface ViewFocusApi {
  focused: boolean;
  enter: () => void;
  exit: () => void;
}

const ViewFocusContext = createContext<ViewFocusApi | null>(null);

export function useViewFocused() {
  return useContext(ViewFocusContext)?.focused ?? false;
}

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

function hasOpenOverlay() {
  return Boolean(
    document.querySelector(
      [
        '[data-calendar-popover="preview"]',
        '[data-slot="dropdown-menu-content"][data-state="open"]',
        '[data-slot="dialog-content"][data-state="open"]',
        '[data-slot="select-content"][data-state="open"]',
        '.fc-popover',
      ].join(','),
    ),
  );
}

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

export function ViewFocus({ label, children, className }: ViewFocusProps) {
  const [focused, setFocused] = useState(false);
  const { isCollapsed } = useSidebar();

  const enter = useCallback(() => setFocused(true), []);
  const exit = useCallback(() => setFocused(false), []);

  useKeyboardShortcut(
    'escape',
    () => {
      if (!hasOpenOverlay()) exit();
    },
    { enabled: focused, ignoreInputs: false },
  );

  const api = useMemo(
    () => ({ focused, enter, exit }),
    [focused, enter, exit],
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
                'fixed inset-x-0 bottom-0 top-13 z-40 flex flex-col overflow-hidden overscroll-none bg-background md:top-14',
                isCollapsed ? 'md:left-18' : 'md:left-56 lg:left-64',
                'transition-[left] duration-300 ease-in-out',
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

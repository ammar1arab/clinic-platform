'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui';
import { SoftTip } from '@/components/primitives';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from '@/hooks/shared/use-keyboard-shortcut';
import { useSidebar } from '@/providers/sidebar-provider';
import { IconMaximize, IconMinimize } from '@/constants/icons';

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
  if (!api) return null;

  return (
    <SoftTip label={api.focused ? 'Exit focus' : 'Focus view'}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={api.focused ? api.exit : api.enter}
        aria-label={api.focused ? 'Exit focus' : 'Focus view'}
        className={cn(
          'size-8 shrink-0 rounded-lg border-border/70 bg-background/80 text-muted-foreground shadow-2xs',
          'hover:border-primary/40 hover:bg-card hover:text-foreground active:scale-95',
          className,
        )}
      >
        {api.focused ? <IconMinimize className="size-3.5" /> : <IconMaximize className="size-3.5" />}
      </Button>
    </SoftTip>
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
        aria-label={focused ? `${label} focus view` : undefined}
        className={cn(
          focused
            ? [
                'fixed inset-x-0 bottom-0 top-13 z-40 flex flex-col overflow-hidden overscroll-none bg-background pb-[env(safe-area-inset-bottom)] md:top-14',
                isCollapsed ? 'md:left-18' : 'md:left-56 lg:left-64',
                'transition-[left] duration-300 ease-in-out',
                'animate-in fade-in-0 zoom-in-[0.985] duration-300 ease-out',
              ]
            : cn('relative', className),
        )}
      >
        <div
          className={cn(
            'min-h-0 min-w-0',
            focused && 'flex h-full min-h-0 flex-1 flex-col overflow-hidden',
          )}
        >
          {content}
        </div>
      </div>
    </ViewFocusContext.Provider>
  );
}

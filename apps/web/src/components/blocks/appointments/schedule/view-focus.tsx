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
import { IconMaximize, IconMinimize } from '@/constants/icons';
import { useLanguage } from '@/providers';

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
        '[data-calendar-popover]',
        '[data-slot="dropdown-menu-content"][data-state="open"]',
        '[data-slot="dialog-content"][data-state="open"]',
        '[data-slot="select-content"][data-state="open"]',
        '.fc-popover',
      ].join(','),
    ),
  );
}

function applyViewFocus(on: boolean) {
  if (on) document.documentElement.setAttribute('data-view-focus', 'true');
  else document.documentElement.removeAttribute('data-view-focus');
}

export function ViewFocusToggle({ className }: { className?: string }) {
  const api = useViewFocusControls();
  const { t } = useLanguage();
  if (!api) return null;

  return (
    <SoftTip label={api.focused ? t.layout.exitFocus : t.layout.focusView}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={api.focused ? api.exit : api.enter}
        aria-label={api.focused ? t.layout.exitFocus : t.layout.focusView}
        aria-pressed={api.focused}
        className={cn(
          'size-8 shrink-0 rounded-lg border-border/70 bg-background/80 text-muted-foreground shadow-2xs',
          'hover:border-primary/40 hover:bg-card hover:text-foreground active:scale-95',
          api.focused && 'border-primary/50 bg-card text-foreground',
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

  const enter = useCallback(() => {
    applyViewFocus(true);
    setFocused(true);
  }, []);

  const exit = useCallback(() => {
    applyViewFocus(false);
    setFocused(false);
  }, []);

  const bind = useCallback((node: HTMLDivElement | null) => {
    if (!node) applyViewFocus(false);
  }, []);

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
      <div
        ref={bind}
        data-view-focus={focused ? 'true' : undefined}
        aria-label={focused ? `${label} focus view` : undefined}
        className={cn(
          'relative isolate flex min-h-0 flex-1 flex-col',
          focused && 'h-full overflow-hidden bg-background',
          className,
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {content}
        </div>
      </div>
    </ViewFocusContext.Provider>
  );
}

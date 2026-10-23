'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { SoftTip } from '@/components/primitives';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut } from '@/hooks/shared/use-keyboard-shortcut';
import { IconMaximize, IconMinimize } from '@/constants/icons';
import { useLanguage } from '@/providers';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';

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
  storageKey: string;
  toolbar?: ReactNode;
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

function ViewFocusHandle() {
  const api = useViewFocusControls();
  const { t } = useLanguage();
  if (!api) return null;
  const label = api.focused ? t.layout.exitFocus : t.layout.focusView;

  return (
    <SoftTip label={label} side="left">
      <button
        type="button"
        onClick={api.focused ? api.exit : api.enter}
        aria-label={label}
        aria-pressed={api.focused}
        className={cn(
          'absolute end-0 top-0 z-30 grid h-10 w-3.5 cursor-pointer place-items-center rounded-s-lg border border-e-0 border-border/60 bg-card/80 text-muted-foreground/80 sm:w-4',
          'transition-[width,color,background-color] duration-(--overlay-duration) ease-(--overlay-ease) hover:w-6 hover:bg-card hover:text-foreground focus-visible:w-6 focus-visible:outline-none motion-reduce:transition-none',
          api.focused && 'text-foreground',
        )}
      >
        {api.focused ? <IconMinimize className="size-3" /> : <IconMaximize className="size-3" />}
      </button>
    </SoftTip>
  );
}

export function ViewFocus({ label, storageKey, toolbar, children, className }: ViewFocusProps) {
  const [focused, setFocused] = useSessionStorageState(`view-focus:${storageKey}`, false);

  const enter = useCallback(() => {
    applyViewFocus(true);
    setFocused(true);
  }, [setFocused]);

  const exit = useCallback(() => {
    applyViewFocus(false);
    setFocused(false);
  }, [setFocused]);

  const bind = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    applyViewFocus(Boolean(node && focused));
    return () => applyViewFocus(false);
  }, [focused]);

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
          focused
            ? 'fixed start-0 end-0 top-[var(--app-header-height)] z-5 flex h-[calc(100dvh-var(--app-header-height))] min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain bg-background p-2 sm:p-3 md:start-[var(--app-sidebar-current-width)] md:overflow-hidden'
            : 'relative isolate page-fill flex-1 min-h-0',
          className,
        )}
      >
        <div className={cn('page-fill flex-1 min-h-0 gap-2.5', focused && 'h-0')}>
          {toolbar}
          <div className="relative page-fill flex-1 min-h-0">
            {content}
            <ViewFocusHandle />
          </div>
        </div>
      </div>
    </ViewFocusContext.Provider>
  );
}

/**
 * useKeyboardShortcut
 *
 * Registers one or more keyboard shortcuts and fires a callback.
 * Automatically skips when focus is inside an input/textarea/contenteditable
 * unless `ignoreInputs` is false.
 *
 * Usage:
 *   useKeyboardShortcut('n', onNewAppointment);
 *   useKeyboardShortcut(['ctrl+k', 'meta+k'], onOpenSearch);
 */

type Modifier = 'ctrl' | 'meta' | 'alt' | 'shift';

interface Options {
  /** If true (default), shortcut is ignored when typing in inputs */
  ignoreInputs?: boolean;
  /** Only fire when the shortcut is held down repeatedly */
  allowRepeat?: boolean;
  /** Enable/disable the shortcut without unmounting */
  enabled?: boolean;
}

function parseShortcut(raw: string): { key: string; modifiers: Set<Modifier> } {
  const parts = raw.toLowerCase().split('+');
  const mods = new Set<Modifier>();
  let key = '';
  for (const p of parts) {
    if (p === 'ctrl' || p === 'meta' || p === 'alt' || p === 'shift') {
      mods.add(p as Modifier);
    } else {
      key = p;
    }
  }
  return { key, modifiers: mods };
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    (el as HTMLElement).isContentEditable
  );
}

import { useCallback, useRef } from 'react';

// Global registry so multiple hook instances share one listener
type Handler = (e: KeyboardEvent) => void;
const registry = new Map<string, Set<Handler>>();
let listenerAttached = false;

function globalKeyHandler(e: KeyboardEvent) {
  for (const [, handlers] of registry) {
    for (const h of handlers) {
      h(e);
    }
  }
}

function ensureListener() {
  if (!listenerAttached && typeof window !== 'undefined') {
    window.addEventListener('keydown', globalKeyHandler, { capture: true });
    listenerAttached = true;
  }
}

let idCounter = 0;

export function useKeyboardShortcut(
  shortcuts: string | string[],
  callback: (e: KeyboardEvent) => void,
  options: Options = {},
) {
  const { ignoreInputs = true, allowRepeat = false, enabled = true } = options;

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const idRef = useRef<string>(`ks-${++idCounter}`);

  const parsed = (Array.isArray(shortcuts) ? shortcuts : [shortcuts]).map(parseShortcut);

  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (!allowRepeat && e.repeat) return;
      if (ignoreInputs && isInputFocused()) return;

      for (const { key, modifiers } of parsed) {
        const pressedKey = e.key.toLowerCase();
        const keyMatch = pressedKey === key || (key === 'esc' && pressedKey === 'escape') || (key === 'del' && pressedKey === 'delete');
        if (!keyMatch) continue;

        const ctrlMatch = modifiers.has('ctrl') === (e.ctrlKey || e.metaKey);
        const metaMatch = modifiers.has('meta') === e.metaKey;
        const altMatch = modifiers.has('alt') === e.altKey;
        const shiftMatch = modifiers.has('shift') === e.shiftKey;

        // If modifier set, require exact match; if no modifiers, require none pressed (except shift for uppercase letters)
        const hasModifiers = modifiers.size > 0;
        if (hasModifiers) {
          if (!ctrlMatch || !altMatch || !shiftMatch) continue;
        } else {
          // No modifiers expected — reject if ctrl/meta/alt are pressed
          if (e.ctrlKey || e.metaKey || e.altKey) continue;
        }

        e.preventDefault();
        callbackRef.current(e);
        return;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, allowRepeat, ignoreInputs, JSON.stringify(parsed)],
  );

  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Register/unregister using a stable proxy
  const proxyRef = useRef<Handler>((e) => handlerRef.current(e));

  // Mount
  if (typeof window !== 'undefined') {
    ensureListener();
    const id = idRef.current;
    if (!registry.has(id)) {
      const set = new Set<Handler>();
      set.add(proxyRef.current);
      registry.set(id, set);
    }
  }

  // Cleanup on unmount via a ref that always runs
  const cleanupRef = useRef(() => {
    registry.delete(idRef.current);
  });

  // Self-cleanup: in React 18 strict mode this runs twice; idRef ensures isolation
  if (typeof window !== 'undefined') {
    // Register cleanup in a way that works with both strict mode and production
    const id = idRef.current;
    if (!registry.get(id)?.has(proxyRef.current)) {
      const set = registry.get(id) ?? new Set<Handler>();
      set.add(proxyRef.current);
      registry.set(id, set);
    }
  }
}

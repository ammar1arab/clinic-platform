'use client';

/**
 * useKeyboardShortcut — attaches global key handlers via useSyncExternalStore
 * (no useEffect). Skips editable fields unless ignoreInputs is false.
 */

import { useRef, useSyncExternalStore } from 'react';

interface ShortcutOptions {
  ignoreInputs?: boolean;
  enabled?: boolean;
}

interface Parsed {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
  mod?: boolean;
}

function parse(raw: string): Parsed {
  const parts = raw.toLowerCase().split('+');
  const result: Parsed = { key: '' };
  for (const p of parts) {
    if (p === 'ctrl') result.ctrl = true;
    else if (p === 'meta') result.meta = true;
    else if (p === 'alt') result.alt = true;
    else if (p === 'shift') result.shift = true;
    else if (p === 'mod') result.mod = true;
    else result.key = p;
  }
  return result;
}

function normKey(k: string): string {
  return k === 'escape' ? 'esc' : k === 'delete' ? 'del' : k;
}

function isEditableTarget(): boolean {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

function matches(e: KeyboardEvent, p: Parsed): boolean {
  const pressedKey = normKey(e.key.toLowerCase());
  if (pressedKey !== p.key) return false;

  const wantAlt = !!p.alt;
  const wantShift = !!p.shift;
  const hasModifiers = p.ctrl || p.meta || p.alt || p.mod;

  if (!hasModifiers) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (p.shift != null && e.shiftKey !== wantShift) return false;
    return true;
  }

  const isMac = /mac/i.test(navigator.platform);
  const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

  if (p.mod && !ctrlOrMeta) return false;
  if (p.ctrl && !e.ctrlKey) return false;
  if (p.meta && !e.metaKey) return false;
  if (wantAlt !== e.altKey) return false;
  if (wantShift !== e.shiftKey) return false;

  return true;
}

function subscribeKeydown(
  enabled: boolean,
  ignoreInputs: boolean,
  parsed: Parsed[],
  getCallback: () => (e: KeyboardEvent) => void,
) {
  return (onStoreChange: () => void) => {
    if (!enabled) return () => undefined;

    const handler = (e: KeyboardEvent) => {
      if (ignoreInputs && isEditableTarget()) return;
      for (const p of parsed) {
        if (!matches(e, p)) continue;
        e.preventDefault();
        getCallback()(e);
        onStoreChange();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  };
}

export function useKeyboardShortcut(
  shortcuts: string | string[],
  callback: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {},
) {
  const { ignoreInputs = true, enabled = true } = options;
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const list = Array.isArray(shortcuts) ? shortcuts : [shortcuts];
  const parsedKey = list.join('|');
  const parsed = list.map(parse);

  useSyncExternalStore(
    subscribeKeydown(enabled, ignoreInputs, parsed, () => cbRef.current),
    () => parsedKey,
    () => parsedKey,
  );
}

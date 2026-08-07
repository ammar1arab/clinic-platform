'use client';

/**
 * useKeyboardShortcut
 *
 * Attach one or more keyboard shortcuts globally.
 * - Skips when focused on an input/textarea/select/contenteditable (unless ignoreInputs=false)
 * - Supports modifiers: ctrl, meta, alt, shift (e.g. "ctrl+k", "shift+n")
 * - Use "mod" for ctrl on Windows / cmd on Mac
 *
 * Example:
 *   useKeyboardShortcut('n', handleNewAppt);
 *   useKeyboardShortcut(['ctrl+k', 'meta+k'], openSearch);
 *   useKeyboardShortcut('escape', onClose, { ignoreInputs: false });
 */

import { useEffect, useRef } from 'react';

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
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

function matches(e: KeyboardEvent, p: Parsed): boolean {
  const pressedKey = normKey(e.key.toLowerCase());
  if (pressedKey !== p.key) return false;

  const wantCtrl = !!(p.ctrl || p.mod);
  const wantMeta = !!(p.meta || (p.mod && typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)));
  const wantAlt = !!p.alt;
  const wantShift = !!p.shift;

  // If no modifiers required, disallow ctrl/meta/alt (allow shift for capitals if not specified)
  const hasModifiers = p.ctrl || p.meta || p.alt || p.mod;
  if (!hasModifiers) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (p.shift != null && e.shiftKey !== wantShift) return false;
    return true;
  }

  // Exact modifier match
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

  if (p.mod && !ctrlOrMeta) return false;
  if (p.ctrl && !e.ctrlKey) return false;
  if (p.meta && !e.metaKey) return false;
  if (wantAlt !== e.altKey) return false;
  if (wantShift !== e.shiftKey) return false;

  return true;
}

export function useKeyboardShortcut(
  shortcuts: string | string[],
  callback: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {},
) {
  const { ignoreInputs = true, enabled = true } = options;
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const parsed = (Array.isArray(shortcuts) ? shortcuts : [shortcuts]).map(parse);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (ignoreInputs && isEditableTarget()) return;
      for (const p of parsed) {
        if (matches(e, p)) {
          e.preventDefault();
          cbRef.current(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ignoreInputs, JSON.stringify(parsed)]);
}

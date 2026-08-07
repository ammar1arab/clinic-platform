export interface AnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface PopoverPlacement {
  left: number;
  top: number;
  side: 'right' | 'left' | 'bottom' | 'top';
}

const PAD = 12;
const GAP = 12;

const MAX_ANCHOR_W = 120;
const MAX_ANCHOR_H = 56;

export function rectFromPoint(x: number, y: number, size = 4): AnchorRect {
  const half = size / 2;
  return {
    left: x - half,
    top: y - half,
    right: x + half,
    bottom: y + half,
    width: size,
    height: size,
  };
}

export function rectFromElement(
  el: Element | null | undefined,
  fallbackX: number,
  fallbackY: number,
): AnchorRect {
  if (!el || typeof (el as HTMLElement).getBoundingClientRect !== 'function') {
    return rectFromPoint(fallbackX, fallbackY);
  }
  const r = (el as HTMLElement).getBoundingClientRect();
  if (!r.width && !r.height) return rectFromPoint(fallbackX, fallbackY);
  return {
    left: r.left,
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
  };
}

export function clickAnchor(
  clickX: number,
  clickY: number,
  elementRect?: AnchorRect | null,
): AnchorRect {
  if (!elementRect || (elementRect.width <= MAX_ANCHOR_W && elementRect.height <= MAX_ANCHOR_H)) {
    if (elementRect && elementRect.width > 0 && elementRect.height > 0) {
      return elementRect;
    }
    return rectFromPoint(clickX, clickY);
  }

  const w = Math.min(MAX_ANCHOR_W, elementRect.width);
  const h = Math.min(MAX_ANCHOR_H, elementRect.height);
  let left = clickX - w / 2;
  let top = clickY - h / 2;
  left = Math.min(Math.max(elementRect.left, left), elementRect.right - w);
  top = Math.min(Math.max(elementRect.top, top), elementRect.bottom - h);
  return {
    left,
    top,
    right: left + w,
    bottom: top + h,
    width: w,
    height: h,
  };
}

function overlaps(a: AnchorRect, left: number, top: number, width: number, height: number) {
  const right = left + width;
  const bottom = top + height;
  return (
    left < a.right + GAP &&
    right > a.left - GAP &&
    top < a.bottom + GAP &&
    bottom > a.top - GAP
  );
}

export function placePopover(
  anchor: AnchorRect,
  width: number,
  height: number,
  options?: { avoid?: AnchorRect[]; prefer?: PopoverPlacement['side'][] },
): PopoverPlacement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const avoid = options?.avoid ?? [];

  const clampY = (y: number) =>
    Math.min(Math.max(PAD, y), Math.max(PAD, vh - height - PAD));
  const clampX = (x: number) =>
    Math.min(Math.max(PAD, x), Math.max(PAD, vw - width - PAD));

  const midY = clampY(anchor.top + anchor.height / 2 - height / 2);

  const build = (side: PopoverPlacement['side']): PopoverPlacement | null => {
    if (side === 'right') {
      const left = anchor.right + GAP;
      if (left + width > vw - PAD) return null;
      return { left, top: midY, side };
    }
    if (side === 'left') {
      const left = anchor.left - width - GAP;
      if (left < PAD) return null;
      return { left, top: midY, side };
    }
    if (side === 'bottom') {
      const top = anchor.bottom + GAP;
      if (top + height > vh - PAD) return null;
      return {
        left: clampX(anchor.left + anchor.width / 2 - width / 2),
        top,
        side,
      };
    }
    const top = anchor.top - height - GAP;
    if (top < PAD) return null;
    return {
      left: clampX(anchor.left + anchor.width / 2 - width / 2),
      top,
      side,
    };
  };

  const order: PopoverPlacement['side'][] =
    options?.prefer ??
    (avoid.length
      ? ['right', 'left', 'bottom', 'top']
      : ['right', 'left', 'bottom', 'top']);

  for (const side of order) {
    const c = build(side);
    if (!c) continue;
    if (avoid.some((r) => overlaps(r, c.left, c.top, width, height))) continue;
    return c;
  }

  const scores: { side: PopoverPlacement['side']; space: number }[] = (
    [
      { side: 'right' as const, space: vw - anchor.right - PAD },
      { side: 'left' as const, space: anchor.left - PAD },
      { side: 'bottom' as const, space: vh - anchor.bottom - PAD },
      { side: 'top' as const, space: anchor.top - PAD },
    ] as { side: PopoverPlacement['side']; space: number }[]
  ).sort((a, b) => b.space - a.space);

  const best = scores[0].side;
  if (best === 'right') {
    return { left: clampX(anchor.right + GAP), top: midY, side: 'right' };
  }
  if (best === 'left') {
    return { left: clampX(anchor.left - width - GAP), top: midY, side: 'left' };
  }
  if (best === 'bottom') {
    return {
      left: clampX(anchor.left + anchor.width / 2 - width / 2),
      top: clampY(anchor.bottom + GAP),
      side: 'bottom',
    };
  }
  return {
    left: clampX(anchor.left + anchor.width / 2 - width / 2),
    top: clampY(anchor.top - height - GAP),
    side: 'top',
  };
}

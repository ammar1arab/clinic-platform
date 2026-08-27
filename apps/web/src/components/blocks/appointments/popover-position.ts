export interface AnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

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
  try {
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
  } catch {
    return rectFromPoint(fallbackX, fallbackY);
  }
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

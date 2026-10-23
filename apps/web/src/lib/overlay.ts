export const OVERLAY_POP_CLASS = 'overlay-pop overlay-surface';
export const OVERLAY_COLLISION_PADDING = 8;

const PROTECTED_OVERLAY =
  '[data-slot="dropdown-menu-content"], [data-slot="select-content"], [data-slot="popover-content"], [data-slot="dialog-content"], [data-slot="calendar"], [data-radix-select-content], [data-radix-popper-content-wrapper], [data-calendar-popover], .fc-popover';

type DismissEvent = {
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  preventDefault: () => void;
  stopPropagation?: () => void;
  detail?: { originalEvent?: Event };
};

export function overlayEventTarget(event: DismissEvent) {
  return (
    (event.detail?.originalEvent?.target as Node | null) ??
    (event.target as Node | null)
  );
}

export function isProtectedOverlayTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(PROTECTED_OVERLAY));
}

export function preventDismissOnOwnTrigger(event: DismissEvent) {
  const target = overlayEventTarget(event);
  const content = event.currentTarget as HTMLElement | null;
  const id = content?.id;
  if (!id || !target) return;
  const trigger = document.querySelector(`[aria-controls="${CSS.escape(id)}"]`);
  if (trigger?.contains(target)) event.preventDefault();
}

export function keepNestedPortals(event: DismissEvent) {
  if (isProtectedOverlayTarget(overlayEventTarget(event))) {
    event.preventDefault();
  }
}

export function isNestedOverlayOpen() {
  if (typeof document === 'undefined') return false;
  return Boolean(
    document.querySelector(
      '[data-slot="popover-content"][data-state="open"], [data-slot="select-content"][data-state="open"], [data-slot="dropdown-menu-content"][data-state="open"]',
    ),
  );
}

const OVERLAY_TRIGGER =
  '[data-slot$="-trigger"][aria-haspopup], [data-slot="select-trigger"], [data-slot="popover-trigger"]';

function handOffToNextTrigger(event: DismissEvent) {
  const original = event.detail?.originalEvent;
  if (!(original instanceof PointerEvent) || original.button !== 0) return;
  const { clientX, clientY, pointerType } = original;
  const blocked = original.target;
  const openTriggers = new Set(
    [...document.querySelectorAll<HTMLElement>(OVERLAY_TRIGGER)].filter(
      (trigger) => trigger.getAttribute('aria-expanded') === 'true',
    ),
  );
  requestAnimationFrame(() => {
    const trigger = [...document.querySelectorAll<HTMLElement>(OVERLAY_TRIGGER)].findLast((element) => {
      const rect = element.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    });
    if (!trigger || openTriggers.has(trigger) || (blocked instanceof Node && trigger.contains(blocked))) return;
    if (trigger.matches(':disabled, [data-disabled]')) return;
    const init = { bubbles: true, cancelable: true, clientX, clientY, button: 0, pointerType, isPrimary: true };
    trigger.dispatchEvent(new PointerEvent('pointerdown', init));
    trigger.dispatchEvent(new PointerEvent('pointerup', init));
    trigger.dispatchEvent(new MouseEvent('click', init));
  });
}

export function overlayDismissProps<TPointer>(handlers?: {
  onPointerDownOutside?: (event: TPointer) => void;
  preventOwnTrigger?: boolean;
}) {
  return {
    onPointerDownOutside: (event: TPointer) => {
      if (handlers?.preventOwnTrigger !== false) {
        preventDismissOnOwnTrigger(event as DismissEvent);
      }
      handlers?.onPointerDownOutside?.(event);
      if (!(event as unknown as Event).defaultPrevented) handOffToNextTrigger(event as DismissEvent);
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
    },
  };
}

export function overlayPointerProps<TPointer, TInteract>(handlers?: {
  onPointerDownOutside?: (event: TPointer) => void;
  onInteractOutside?: (event: TInteract) => void;
}) {
  return {
    ...overlayDismissProps(handlers),
    onInteractOutside: (event: TInteract) => {
      preventDismissOnOwnTrigger(event as DismissEvent);
      handlers?.onInteractOutside?.(event);
    },
  };
}

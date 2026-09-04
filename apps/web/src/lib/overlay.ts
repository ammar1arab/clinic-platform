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

export function overlayPointerProps<TPointer, TInteract>(handlers?: {
  onPointerDownOutside?: (event: TPointer) => void;
  onInteractOutside?: (event: TInteract) => void;
}) {
  return {
    onPointerDownOutside: (event: TPointer) => {
      preventDismissOnOwnTrigger(event as DismissEvent);
      handlers?.onPointerDownOutside?.(event);
    },
    onInteractOutside: (event: TInteract) => {
      preventDismissOnOwnTrigger(event as DismissEvent);
      handlers?.onInteractOutside?.(event);
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
    },
  };
}

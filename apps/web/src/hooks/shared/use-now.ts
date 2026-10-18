import { useSyncExternalStore, useCallback } from 'react';

let currentTimestamp = typeof Date !== 'undefined' ? Date.now() : 0;

export function useNow(intervalMs = 30_000): Date {
  const subscribeFn = useCallback((onStoreChange: () => void) => {
    const id = setInterval(() => {
      currentTimestamp = Date.now();
      onStoreChange();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const getSnapshot = useCallback(() => currentTimestamp, []);
  const getServerSnapshot = useCallback(() => 0, []);

  const timestamp = useSyncExternalStore(subscribeFn, getSnapshot, getServerSnapshot);
  return new Date(timestamp || currentTimestamp);
}

export function useUnsavedGuard(active: boolean, message: string) {
  useSyncExternalStore(
    () => {
      if (!active) return () => {};
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = '';
      };
      const onClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = (event.target as Element | null)?.closest('a');
        if (!anchor || anchor.target === '_blank') return;
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        if (!window.confirm(message)) {
          event.preventDefault();
          event.stopPropagation();
        }
      };
      window.addEventListener('beforeunload', onBeforeUnload);
      document.addEventListener('click', onClick, true);
      return () => {
        window.removeEventListener('beforeunload', onBeforeUnload);
        document.removeEventListener('click', onClick, true);
      };
    },
    () => active,
    () => false,
  );
}

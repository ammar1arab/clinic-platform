'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setScroller = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && node.dataset.pathname !== pathname) {
        node.scrollTop = 0;
        node.dataset.pathname = pathname;
      }
    },
    [pathname],
  );

  return (
    <div
      ref={setScroller}
      data-page-scroll
      data-pathname={pathname}
      className="page-scroll"
    >
      {children}
    </div>
  );
}

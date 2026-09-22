'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setScroller = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) node.scrollTop = 0;
    },
    [pathname],
  );

  return (
    <div ref={setScroller} data-page-scroll className="page-scroll">
      {children}
    </div>
  );
}

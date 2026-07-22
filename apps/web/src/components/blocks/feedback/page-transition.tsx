'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Subtle content rise on each dashboard page navigation.
 * Short, calm, doesn't fight with data fetchers.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={cn(
        'fade-in min-h-full transition-[opacity,transform] duration-300 ease-out',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className={cn(
        'min-h-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-out',
        className,
      )}
    >
      {children}
    </div>
  );
}

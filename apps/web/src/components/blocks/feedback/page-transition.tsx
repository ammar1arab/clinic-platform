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
        'flex min-h-0 flex-1 flex-col',
        className,
      )}
    >
      {children}
    </div>
  );
}

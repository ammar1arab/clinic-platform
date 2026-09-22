'use client';

import { useRouter } from 'next/navigation';
import { markNavigating } from '@/components/layout/navigation-progress';

export function useRouteNav() {
  const router = useRouter();
  return {
    go(href: string) {
      markNavigating();
      router.push(href);
    },
    prefetch(href: string) {
      void router.prefetch(href);
    },
  };
}

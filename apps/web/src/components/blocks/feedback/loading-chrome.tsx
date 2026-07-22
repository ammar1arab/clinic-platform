'use client';

import { Suspense } from 'react';
import { NavigationProgress } from '@/components/blocks/feedback/navigation-progress';
import { GlobalActivity } from '@/components/blocks/feedback/global-activity';

/**
 * Global loading chrome that lives outside page trees:
 * - top progress on route changes
 * - floating save/refresh pill for React Query activity
 */
export function LoadingChrome() {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <GlobalActivity />
    </>
  );
}

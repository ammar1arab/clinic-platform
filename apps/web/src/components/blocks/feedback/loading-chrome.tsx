'use client';

import { Suspense } from 'react';
import { NavigationProgress } from '@/components/blocks/feedback/navigation-progress';
import { GlobalActivity } from '@/components/blocks/feedback/global-activity';

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

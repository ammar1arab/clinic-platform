'use client';

import { Suspense } from 'react';
import { NavigationProgress } from './navigation-progress';
import { GlobalActivity } from './global-activity';

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

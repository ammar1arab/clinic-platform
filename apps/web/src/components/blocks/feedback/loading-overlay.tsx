'use client';

import { BootSplash } from './boot-splash';

/** Auth / session restore shell — branded splash instead of bare skeletons. */
export function LoadingOverlay() {
  return <BootSplash label="Signing you in securely…" />;
}

'use client';

import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/blocks/feedback/error-boundary';
import { LoadingChrome } from '@/components/blocks/feedback/loading-chrome';
import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { ConfirmProvider } from './confirm-provider';
import { SidebarProvider } from './sidebar-provider';

/**
 * Single composition root for all client-side providers.
 * Order matters: theme → data layer → auth → UI dialogs → layout state.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <ConfirmProvider>
              <SidebarProvider>
                {children}
                <LoadingChrome />
                <Toaster position="top-right" richColors closeButton />
              </SidebarProvider>
            </ConfirmProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

'use client';

import { Toaster, TooltipProvider } from '@/components/ui';
import { ErrorBoundary } from '@/components/layout/error-boundary';
import { LoadingChrome } from '@/components/layout/loading-chrome';

import { ThemeProvider } from './theme-provider';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { ConfirmProvider } from './confirm-provider';
import { SidebarProvider } from './sidebar-provider';
import { LanguageProvider } from './language-provider';

export { ThemeProvider, QueryProvider, AuthProvider, ConfirmProvider, SidebarProvider, LanguageProvider };
export { useAuth } from './auth-provider';
export { useConfirm } from './confirm-provider';
export { useLanguage } from './language-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <SidebarProvider>
                <ConfirmProvider>
                  <TooltipProvider>
                    {children}
                    <LoadingChrome />
                    <Toaster position="top-right" richColors closeButton />
                  </TooltipProvider>
                </ConfirmProvider>
              </SidebarProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

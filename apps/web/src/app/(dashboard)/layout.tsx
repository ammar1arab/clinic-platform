'use client';

import { useRouter } from 'next/navigation';
import { useAuth, useLanguage } from '@/providers';
import { SidebarBlock, TopbarBlock, PageTransition } from '@/components/layout';
import { LoadingState } from '@/components/primitives';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isHydrated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  if (!isHydrated || isLoading) {
    return <LoadingState variant="page" text={t.common.checkingPermissions} />;
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return <LoadingState variant="page" text={t.common.loadingSession} />;
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <SidebarBlock />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background transition-all duration-300 ease-in-out">
        <TopbarBlock />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-app-main-pad pb-app-main-pad-bottom">
          <PageTransition className="flex min-h-0 min-w-0 flex-1 flex-col">
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}

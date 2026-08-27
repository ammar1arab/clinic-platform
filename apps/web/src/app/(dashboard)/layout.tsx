'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import {
  SidebarBlock,
  TopbarBlock,
} from '@/components/blocks/layout';
import {
  LoadingOverlay,
  PageTransition,
} from '@/components/blocks/feedback';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return <LoadingOverlay />;
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

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers';
import { SidebarBlock } from '@/components/blocks/layout/sidebar';
import { TopbarBlock } from '@/components/blocks/layout/topbar';
import { LoadingOverlay } from '@/components/blocks/feedback/loading-overlay';
import { PageTransition } from '@/components/blocks/feedback/page-transition';

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
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <SidebarBlock />
      <div className="flex flex-1 flex-col overflow-hidden bg-background transition-all duration-300 ease-in-out">
        <TopbarBlock />
        <main className="flex-1 overflow-y-auto overscroll-y-contain p-2.5 sm:p-3 md:p-5 lg:p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}

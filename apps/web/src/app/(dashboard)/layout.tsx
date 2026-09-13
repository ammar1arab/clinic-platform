'use client';

import { redirect, usePathname } from 'next/navigation';
import { useAuth, useLanguage } from '@/providers';
import { SidebarBlock, TopbarBlock, PageTransition } from '@/components/layout';
import { LoadingState } from '@/components/primitives';
import { canAccessPath, hasClinicNav, homePathForRole } from '@/constants/nav-access';
import { ROUTES } from '@/constants/routes';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, isHydrated } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();

  if (!isHydrated || isLoading) {
    return <LoadingState variant="page" text={t.common.checkingPermissions} />;
  }

  if (!isAuthenticated) {
    redirect(ROUTES.LOGIN);
  }

  if (!canAccessPath(pathname, user?.role)) {
    redirect(homePathForRole(user?.role));
  }

  const showNav = hasClinicNav(user?.role);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {showNav ? <SidebarBlock /> : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background transition-all duration-300 ease-in-out">
        <TopbarBlock showNav={showNav} />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-app-main-pad py-app-main-pad-y">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}

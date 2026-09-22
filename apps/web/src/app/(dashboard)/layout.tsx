'use client';

import { redirect, usePathname } from 'next/navigation';
import { useAuth } from '@/providers';
import {
  SidebarBlock,
  TopbarBlock,
  PageTransition,
  DashboardShellFallback,
} from '@/components/layout';
import { canAccessPath, hasClinicNav, homePathForRole } from '@/constants/nav-access';
import { ROUTES } from '@/constants/routes';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading, isHydrated } = useAuth();
  const pathname = usePathname();

  if (!isHydrated || (token && isLoading)) {
    return <DashboardShellFallback />;
  }

  if (!token || !user) {
    redirect(ROUTES.LOGIN);
  }

  if (!canAccessPath(pathname, user.role)) {
    redirect(homePathForRole(user.role));
  }

  const showNav = hasClinicNav(user.role);

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

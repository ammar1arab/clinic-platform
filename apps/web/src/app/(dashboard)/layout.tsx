'use client';

import { Suspense, useCallback } from 'react';
import { redirect, usePathname } from 'next/navigation';
import { ErrorState } from '@/components/primitives';
import { useAuth } from '@/providers';
import {
  SidebarBlock,
  TopbarBlock,
  PageTransition,
  DashboardShellFallback,
} from '@/components/layout';
import { canAccessPath, hasClinicNav, homePathForRole } from '@/constants/nav-access';
import { ROUTES } from '@/constants/routes';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { bindClinicBrand, useClinic, useClinicBrand } from '@/hooks/api/use-clinic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, isHydrated, isSessionError, retrySession } = useAuth();
  const pathname = usePathname();
  const clinicId = useClinicId();
  const { data: clinic } = useClinic(clinicId);
  const brand = useClinicBrand();
  const bindChrome = useCallback(
    (node: HTMLDivElement | null) =>
      bindClinicBrand(node, brand, { clinicId, clinic }),
    [brand, clinic, clinicId],
  );

  if (!isHydrated || isLoading) {
    return (
      <div ref={bindChrome} className="contents">
        <DashboardShellFallback />
      </div>
    );
  }

  if (isSessionError) return <ErrorState onRetry={retrySession} />;

  if (!isAuthenticated || !user) {
    redirect(ROUTES.LOGIN);
  }

  if (!canAccessPath(pathname, user.role)) {
    redirect(homePathForRole(user.role));
  }

  const showNav = hasClinicNav(user.role);

  return (
    <div ref={bindChrome} className="flex h-dvh w-full overflow-hidden bg-background">
      {showNav ? (
        <Suspense
          fallback={
            <div
              aria-hidden
              className="hidden shrink-0 md:block md:w-56 lg:w-64 [[data-sidebar=collapsed]_&]:md:w-18 [[data-sidebar=collapsed]_&]:lg:w-18"
            />
          }
        >
          <SidebarBlock />
        </Suspense>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background transition-all duration-300 ease-in-out">
        <Suspense
          fallback={
            <div
              aria-hidden
              className="h-app-header shrink-0 border-b border-border/80 bg-background/80"
            />
          }
        >
          <TopbarBlock showNav={showNav} />
        </Suspense>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-app-main-pad py-app-main-pad-y">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}

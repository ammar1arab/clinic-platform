'use client';

import { Suspense, useCallback } from 'react';
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
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { useClinic, useClinicLogo } from '@/hooks/api/use-clinic';

function brandChannels(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (piece: number) => {
    const srgb = piece / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const red = channel((value >> 16) & 255);
  const green = channel((value >> 8) & 255);
  const blue = channel(value & 255);
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.min(0.18, Math.hypot(a, b));
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return { chroma: chroma.toFixed(3), hue: (((hue % 360) + 360) % 360).toFixed(1) };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading, isHydrated } = useAuth();
  const pathname = usePathname();
  const clinicId = useClinicId();
  const { data: clinic } = useClinic(clinicId);
  const brand = clinic?.brandColor;
  const branded = Boolean(brand && /^#[0-9A-Fa-f]{6}$/.test(brand));
  const logoUrl = useClinicLogo();
  const bindChrome = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const head = document.head;
    const owned = ['icon', 'apple-touch-icon'];
    const brandStyleId = 'clinic-brand';

    owned.forEach((rel) => head.querySelector(`link[data-clinic-logo="${rel}"]`)?.remove());
    if (logoUrl) {
      owned.forEach((rel) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = logoUrl;
        link.setAttribute('data-clinic-logo', rel);
        head.appendChild(link);
      });
    }

    head.querySelector(`style[data-clinic-brand="${brandStyleId}"]`)?.remove();
    if (branded && brand) {
      const { chroma, hue } = brandChannels(brand);
      const style = document.createElement('style');
      style.setAttribute('data-clinic-brand', brandStyleId);
      style.textContent = [
        `:root{--primary:oklch(0.55 ${chroma} ${hue});--ring:var(--primary);--brand:var(--primary)}`,
        `.dark{--primary:oklch(0.62 ${chroma} ${hue});--ring:var(--primary);--brand:var(--primary)}`,
      ].join('');
      head.appendChild(style);
    }

    return () => {
      owned.forEach((rel) => head.querySelector(`link[data-clinic-logo="${rel}"]`)?.remove());
      head.querySelector(`style[data-clinic-brand="${brandStyleId}"]`)?.remove();
    };
  }, [brand, branded, logoUrl]);

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
    <div ref={bindChrome} className="flex h-dvh w-full overflow-hidden bg-background">
      {showNav ? (
        <Suspense
          fallback={
            <div
              aria-hidden
              className="hidden shrink-0 md:block md:w-56 lg:w-64"
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

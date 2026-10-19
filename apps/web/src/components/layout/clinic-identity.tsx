'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ROLE } from '@clinic/types';
import { ROUTES } from '@/constants/routes';
import { EntityAvatar, SoftTip } from '@/components/primitives';
import { useClinicLogo } from '@/hooks/api/use-clinic';
import { useAuth, useLanguage } from '@/providers';
import { cn } from '@/lib/utils';

export function ProfileLink({ onClick, mobile = false, collapsed = true }: { onClick?: () => void; mobile?: boolean; collapsed?: boolean }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  if (user?.role !== ROLE.OWNER && user?.role !== ROLE.PRACTITIONER) return null;
  const compact = mobile || collapsed;
  const link = (
    <Link href={ROUTES.PROFILE} onClick={onClick} aria-label={compact ? t.common.accountProfile : undefined}
      aria-current={pathname === ROUTES.PROFILE ? 'page' : undefined}
      className={cn('flex items-center rounded-xl bg-transparent text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
        compact ? 'justify-center' : 'w-full gap-3 px-3 py-2.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        mobile ? 'size-8' : compact ? 'size-10' : '',
        pathname === ROUTES.PROFILE && !compact && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground')}
    >
      <EntityAvatar src={user.imageUrl} seed={user.clinicUserId} size={mobile || !compact ? 'default' : 'lg'} className="bg-transparent ring-0" />
      {!compact && <span>{t.common.accountProfile}</span>}
    </Link>
  );
  return <div className={cn('flex shrink-0', mobile ? 'items-center' : collapsed ? 'justify-center px-2 py-3' : 'px-2.5 py-3')}>
    {compact ? <SoftTip label={t.common.accountProfile}>{link}</SoftTip> : link}
  </div>;
}

export function ClinicLockup() {
  const logoUrl = useClinicLogo();

  if (!logoUrl) return <span aria-hidden="true" className="size-8 shrink-0" />;

  return (
    <Image
      key={logoUrl}
      src={logoUrl}
      alt=""
      width={32}
      height={32}
      unoptimized
      className="size-8 shrink-0 bg-transparent object-contain"
    />
  );
}

export function MobileHeaderIdentity() {
  return (
    <div className="relative size-8 shrink-0" aria-live="polite">
      <ClinicLockup />
    </div>
  );
}

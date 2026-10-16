'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ROLE } from '@clinic/types';
import { ROUTES } from '@/constants/routes';
import { EntityAvatar, SoftTip } from '@/components/primitives';
import { BrandMark } from '@/components/primitives/display/brand-mark';
import { useClinicLogo } from '@/hooks/api/use-clinic';
import { useClinicId } from '@/hooks/shared/use-clinic-id';
import { stripSolidBackdrop, writeClinicLogo } from '@/lib/clinic-logo';
import { useAuth, useLanguage } from '@/providers';
import { cn } from '@/lib/utils';

export function ProfileLink({ onClick, mobile = false }: { onClick?: () => void; mobile?: boolean }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (user?.role !== ROLE.OWNER) return null;
  return (
    <div className={cn('flex shrink-0', mobile ? 'items-center' : 'justify-center px-2 py-3')}>
      <SoftTip label={t.practitioner.profile}>
        <Link
          href={ROUTES.PROFILE}
          onClick={onClick}
          aria-label={t.practitioner.profile}
          className={cn(
            'grid place-items-center overflow-hidden rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-ring',
            mobile ? 'size-8' : 'size-10',
          )}
        >
          <EntityAvatar
            src={user.imageUrl}
            seed={user.clinicUserId}
            size={mobile ? 'default' : 'lg'}
            className="bg-transparent ring-0"
          />
        </Link>
      </SoftTip>
    </div>
  );
}

export function ClinicLockup() {
  const clinicId = useClinicId();
  const logoUrl = useClinicLogo();

  if (!logoUrl) return <BrandMark size="sm" />;

  return (
    <Image
      key={logoUrl}
      src={logoUrl}
      alt=""
      width={32}
      height={32}
      unoptimized
      className="size-8 shrink-0 bg-transparent object-contain"
      onLoad={() => {
        if (!clinicId) return;
        void stripSolidBackdrop(logoUrl).then((next) => {
          if (!next || next === logoUrl) return;
          writeClinicLogo(clinicId, next);
        });
      }}
    />
  );
}

export function MobileHeaderIdentity({
  open,
  onProfileClick,
}: {
  open: boolean;
  onProfileClick?: () => void;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const showProfile = open && user?.role === ROLE.OWNER;

  return (
    <div className="relative size-8 shrink-0" aria-live="polite">
      <span
        aria-hidden="true"
        className={`absolute inset-0 grid place-items-center transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
          showProfile ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <ClinicLockup />
      </span>
      {user?.role === ROLE.OWNER ? (
        <Link
          href={ROUTES.PROFILE}
          onClick={onProfileClick}
          aria-label={t.practitioner.profile}
          aria-hidden={!showProfile}
          tabIndex={showProfile ? 0 : -1}
          className={`absolute inset-0 grid place-items-center overflow-hidden rounded-full transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            showProfile ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'
          }`}
        >
          <EntityAvatar
            src={user.imageUrl}
            seed={user.clinicUserId}
            size="default"
            className="bg-transparent ring-0"
          />
        </Link>
      ) : null}
    </div>
  );
}

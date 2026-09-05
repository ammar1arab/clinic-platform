'use client';

import { EmptyState } from '@/components/primitives';
import { IconInfo } from '@/constants/icons';
import { useLanguage } from '@/providers';

export default function PractitionerHomePage() {
  const { t } = useLanguage();

  return (
    <EmptyState
      icon={IconInfo}
      title={t.layout.unavailable.title}
      description={t.layout.unavailable.description}
      className="flex-1"
    />
  );
}

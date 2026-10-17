'use client';

import { EmptyState } from '@/components/primitives';
import { IconDashboard } from '@/constants/icons';
import { useLanguage } from '@/providers';

export default function PractitionerHomePage() {
  const { t } = useLanguage();
  return <EmptyState icon={IconDashboard} title={t.dashboard.homeEmptyTitle} description={t.dashboard.homeEmptyDesc} className="page-fill" />;
}

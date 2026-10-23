'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReportView } from '@/components/blocks/reports/report-view';
import { EmptyState } from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { parseReportViewRequest } from '@/lib/report-view';
import { useLanguage } from '@/providers';

function ReportViewRoute() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const request = parseReportViewRequest(params);
  if (!request) return <EmptyState className="page-fill-always" icon={IconFileText} title={t.common.noResults} />;
  return <ReportView request={request} />;
}

export default function ReportViewPage() {
  return (
    <Suspense fallback={null}>
      <ReportViewRoute />
    </Suspense>
  );
}

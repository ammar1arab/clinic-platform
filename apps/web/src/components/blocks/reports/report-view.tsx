'use client';

import { useState } from 'react';
import { Card, CardContent, Skeleton } from '@/components/ui';
import {
  DEFAULT_PAGE_SIZE,
  DirectoryTable,
  EmptyState,
  EntityMetaStat,
  EntityMobileCard,
  ErrorState,
  PageBack,
  Pagination,
  TableSkeleton,
  TruncatedText,
  type DirectoryColumn,
} from '@/components/primitives';
import { IconFileText } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { useReportView } from '@/hooks/api/use-reports';
import type { ReportViewRequest } from '@/lib/report-view';
import { formatDate, formatDateTime } from '@/lib/datetime';
import { useLanguage } from '@/providers';

type Row = Record<string, string | number | null>;

const cell = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

export function ReportView({ request }: { request: ReportViewRequest }) {
  const { t, lang } = useLanguage();
  const query = useReportView(request);
  const [page, setPage] = useState(1);
  const data = query.data;
  const back = <PageBack backHref={ROUTES.REPORTS} />;

  if (!data) {
    return query.isError ? (
      <div className="page-fill-always gap-3">
        {back}
        <ErrorState className="page-fill-always" onRetry={() => void query.refetch()} />
      </div>
    ) : (
      <div className="page-fill-always gap-3">
        {back}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
        <TableSkeleton className="page-fill-always" rows={24} cols={4} hasHeader={false} />
      </div>
    );
  }

  const rows = data.rows as Row[];
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;
  const pageRows = rows.slice(offset, offset + DEFAULT_PAGE_SIZE).map((row, index) => ({ id: String(offset + index), row }));
  const [titleColumn, ...restColumns] = data.columns;
  const columns: DirectoryColumn<(typeof pageRows)[number]>[] = data.columns.map((column) => ({
    id: column.key,
    label: column.header,
    render: ({ row }) => <TruncatedText>{cell(row[column.key])}</TruncatedText>,
  }));
  const period = request.from || request.to
    ? [request.from, request.to].filter(Boolean).map((value) => formatDate(value, undefined, lang)).join(' – ')
    : null;

  return (
    <div className={rows.length ? 'min-w-0 space-y-4' : 'page-fill-always min-w-0 gap-4'}>
      {back}
      <header className="min-w-0 space-y-1">
        <h1 className="truncate font-heading text-lg font-semibold tracking-tight sm:text-xl">{data.title}</h1>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">
          {[data.letterhead.clinicName, `${t.reports.generatedAt} ${formatDateTime(data.generatedAt, undefined, lang)}`, period && `${t.reports.reportPeriod}: ${period}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </header>

      {data.summary.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {data.summary.map((item) => (
            <Card key={item.label} className="gap-0 py-0">
              <CardContent className="min-w-0 space-y-1 p-3 sm:p-4">
                <p className="truncate text-xs text-muted-foreground">{item.label}</p>
                <p className="truncate font-heading text-base font-semibold tabular-nums sm:text-lg">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {rows.length ? (
        <>
          <DirectoryTable
            rows={pageRows}
            columns={columns}
            rowKey={(item) => item.id}
            scroll={false}
            className="hidden lg:flex"
          />
          <div className="grid gap-3 md:grid-cols-2 lg:hidden">
            {pageRows.map(({ id, row }) => (
              <EntityMobileCard
                key={id}
                title={cell(row[titleColumn.key])}
                meta={restColumns.map((column) => (
                  <EntityMetaStat key={column.key} label={column.header} value={cell(row[column.key])} />
                ))}
              />
            ))}
          </div>
          {rows.length > DEFAULT_PAGE_SIZE ? (
            <Pagination page={page} totalItems={rows.length} pageSize={DEFAULT_PAGE_SIZE} resetScroll={false} onPageChange={setPage} />
          ) : null}
        </>
      ) : (
        <EmptyState className="page-fill-always" icon={IconFileText} title={t.common.noResults} />
      )}
    </div>
  );
}

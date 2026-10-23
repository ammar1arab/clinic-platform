'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { EmptyState } from '../states/empty';
import { Pagination } from './pagination';
import { TableFrame } from './table-frame';

export type ResourceColumn<T> = {
  id: string;
  header: ReactNode;
  className?: string;
  cellClassName?: string;
  skeleton: string;
  render: (item: T) => ReactNode;
};

const LOADING_ROWS = Array.from({ length: 3 }, (_, index) => index);

export function ResourceTable<T>({
  rows,
  columns,
  rowKey,
  inactive,
  isLoading,
  empty,
  mobileCard,
  pagination,
}: {
  rows: readonly T[];
  columns: readonly ResourceColumn<T>[];
  rowKey: (item: T) => string;
  inactive: (item: T) => boolean;
  isLoading: boolean;
  empty: Pick<ComponentProps<typeof EmptyState>, 'icon' | 'title' | 'description'>;
  mobileCard: (item: T) => ReactNode;
  pagination: ComponentProps<typeof Pagination>;
}) {
  const showEmpty = !isLoading && pagination.totalItems === 0;
  return (
    <>
      <div className="hidden md:flex md:min-h-0 md:flex-1 md:flex-col">
        <TableFrame className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-auto overscroll-contain">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.id} className={column.className}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && LOADING_ROWS.map((index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.id}><Skeleton className={column.skeleton} /></TableCell>
                    ))}
                  </TableRow>
                ))}
                {rows.map((item) => (
                  <TableRow key={rowKey(item)} className={inactive(item) ? 'opacity-60' : undefined}>
                    {columns.map((column) => (
                      <TableCell key={column.id} className={column.cellClassName}>{column.render(item)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {showEmpty && <EmptyState framed={false} className="page-fill" {...empty} />}
          </div>
        </TableFrame>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain md:hidden">
        {isLoading && LOADING_ROWS.map((index) => (
          <div key={index} className="rounded-xl border border-border/70 bg-card p-4">
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
        {showEmpty && <EmptyState className="flex-1" {...empty} />}
        {rows.map(mobileCard)}
      </div>

      <Pagination {...pagination} />
    </>
  );
}

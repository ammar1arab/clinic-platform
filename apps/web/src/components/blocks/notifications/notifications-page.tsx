'use client';

import { DEFAULT_PAGE_SIZE } from '@/components/primitives/display/pagination';

import { useMemo, useRef, useState } from 'react';
import type { NotificationDTO } from '@clinic/types';
import { Badge, Button, Popover, SelectItem, Skeleton } from '@/components/ui';
import {
  DatePicker, DirectoryToolbar, EmptyState, ErrorState,
  FilterPanel, FilterSelect, FilterTrigger, FormField, Pagination, SoftTip,
} from '@/components/primitives';
import { IconBell, IconCheckCheck, IconChevronRight, IconSettings } from '@/constants/icons';
import { ROUTES } from '@/constants/routes';
import { HIGHLIGHT_SURFACE_CLASS } from '@/constants/status';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/api/use-notifications';
import { useSessionStorageState } from '@/hooks/shared/use-session-storage-state';
import { useNow } from '@/hooks/shared/use-now';
import { notificationAge, notificationCopy } from '@/lib/notification-copy';
import { toDateParam } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { useAuth, useLanguage } from '@/providers';
import { NotificationDetailDialog, NotificationTypeIcon } from './notification-detail-dialog';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;
const DEFAULT_FILTERS = { search: '', status: '', type: '', from: '', to: '', sort: 'newest' };

export function NotificationsPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { user } = useAuth();
  const { query, items, unread, markRead, markAllRead } = useNotifications({ realtime: false });
  const [filters, setFilters] = useSessionStorageState(
    `${user?.clinicUserId ?? 'none'}:notifications-filters`, DEFAULT_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<NotificationDTO | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const now = useNow(60_000);
  const types: Record<string, string> = t.notifications.types;
  const typeLabel = (type: string) => types[type] ?? type.replaceAll('_', ' ');
  const availableTypes = [...new Set([...Object.keys(types), ...(items ?? []).map((item) => item.type)])];
  const activeCount = [filters.status, filters.type, filters.from, filters.to].filter(Boolean).length;

  const updateFilter = (key: keyof typeof DEFAULT_FILTERS, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters((current) => ({ ...DEFAULT_FILTERS, search: current.search, sort: current.sort }));
    setPage(1);
  };

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase(lang);
    return (items ?? []).filter((item) => {
      if (filters.status === 'unread' && item.readAt) return false;
      if (filters.status === 'read' && !item.readAt) return false;
      if (filters.type && item.type !== filters.type) return false;
      const day = toDateParam(new Date(item.createdAt));
      if (filters.from && day < filters.from) return false;
      if (filters.to && day > filters.to) return false;
      const copy = notificationCopy(item, t, lang);
      return !search || [copy.title, copy.body, item.title, item.body, item.payload?.bodyAr]
        .filter((value): value is string => typeof value === 'string')
        .join(' ').toLocaleLowerCase(lang).includes(search);
    }).sort((a, b) => {
      const difference = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return filters.sort === 'oldest' ? -difference : difference;
    });
  }, [items, filters, t, lang]);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(1, pageCount));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const openNotification = (item: NotificationDTO) => {
    setSelected(item);
    if (!item.readAt) markRead.mutate(item.id);
  };

  return (
    <div className="page-fill-always min-h-0 gap-2.5">
      <DirectoryToolbar
        search={filters.search}
        onSearchChange={(value) => updateFilter('search', value)}
        searchPlaceholder={t.common.search}
        actions={<>
          {items?.length ? (
            <SoftTip label={t.notifications.countLabel.replace('{count}', String(filtered.length)).replace('{unread}', String(unread))}>
              <Badge variant="default" className="h-8 min-w-8 justify-center rounded-full px-2 tabular-nums">{filtered.length}</Badge>
            </SoftTip>
          ) : null}
          <SoftTip label={t.notifications.markAllRead}>
            <Button type="button" variant="outline" size="icon-sm" aria-label={t.notifications.markAllRead}
              disabled={!unread || markAllRead.isPending} onClick={() => markAllRead.mutate()}>
              <IconCheckCheck className="size-4" />
            </Button>
          </SoftTip>
          <SoftTip label={t.settings.notifications}>
            <Button type="button" variant="outline" size="icon-sm" aria-label={t.settings.notifications}
              onClick={() => router.push(ROUTES.SETTINGS_NOTIFICATIONS)}>
              <IconSettings className="size-4" />
            </Button>
          </SoftTip>
          <Popover>
            <FilterTrigger count={activeCount} />
            <FilterPanel count={activeCount} onClear={clearFilters}>
              <FilterSelect label={t.common.sort} value={filters.sort} onChange={(value) => updateFilter('sort', value)}>
                <SelectItem value="newest">{t.notifications.newest}</SelectItem>
                <SelectItem value="oldest">{t.notifications.oldest}</SelectItem>
              </FilterSelect>
              <FilterSelect label={t.common.status} value={filters.status} onChange={(value) => updateFilter('status', value)}>
                <SelectItem value="unread">{t.notifications.unread}</SelectItem>
                <SelectItem value="read">{t.notifications.read}</SelectItem>
              </FilterSelect>
              <FilterSelect label={t.notifications.type} value={filters.type} onChange={(value) => updateFilter('type', value)}>
                {availableTypes.map((type) => <SelectItem key={type} value={type}>{typeLabel(type)}</SelectItem>)}
              </FilterSelect>
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t.common.from} labelClassName="text-xs">
                  <DatePicker value={filters.from} onChange={(value) => updateFilter('from', value)} placeholder={t.common.from} />
                </FormField>
                <FormField label={t.common.to} labelClassName="text-xs">
                  <DatePicker value={filters.to} onChange={(value) => updateFilter('to', value)} placeholder={t.common.to} />
                </FormField>
              </div>
            </FilterPanel>
          </Popover>
        </>}
      />

      {query.isError && !items ? (
        <ErrorState onRetry={() => void query.refetch()} className="page-fill-always" />
      ) : !items ? (
        <div className="page-fill-always gap-2 overflow-hidden" aria-busy="true">
          {Array.from({ length: 16 }, (_, index) => (
            <div key={index} className="flex shrink-0 items-center gap-3 rounded-xl border bg-card px-3 py-2.5 sm:px-4">
              <Skeleton className="size-8 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState icon={IconBell} title={items.length ? t.common.noResults : t.notifications.empty}
          description={items.length ? t.notifications.noMatchesDesc : t.notifications.emptyDesc} className="flex-1" />
      ) : (
        <div className="page-fill-always gap-3">
          <ul ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-1">
            {pageItems.map((item) => {
              const copy = notificationCopy(item, t, lang);
              const isUnread = !item.readAt;
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => openNotification(item)} className={cn(
                    'group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border bg-card px-3 py-2.5 text-start transition-colors hover:border-primary/40 hover:bg-muted/30 focus-visible:border-primary focus-visible:outline-none sm:px-4',
                    isUnread ? HIGHLIGHT_SURFACE_CLASS : 'border-border/70',
                  )}>
                    <span aria-hidden className={cn('absolute inset-y-3 start-0 w-1 rounded-e-full', isUnread ? 'bg-primary' : 'bg-border')} />
                    <NotificationTypeIcon type={item.type} className="shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-sm', isUnread ? 'font-semibold' : 'font-medium')}>{copy.title}</span>
                      {copy.body ? <span className="block truncate text-xs text-muted-foreground">{copy.body}</span> : null}
                    </span>
                    <time dateTime={item.createdAt} className="shrink-0 text-2xs text-muted-foreground tabular-nums">{notificationAge(item.createdAt, t, lang, now)}</time>
                    {isUnread ? <span className="sr-only">{t.notifications.unread}</span> : null}
                    <IconChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground/60 rtl:-scale-x-100" />
                  </button>
                </li>
              );
            })}
          </ul>
          <Pagination page={currentPage} totalItems={filtered.length} pageSize={PAGE_SIZE} resetScroll={false}
            onPageChange={(value) => { setPage(value); listRef.current?.scrollTo({ top: 0 }); }} />
        </div>
      )}
      <NotificationDetailDialog item={items?.find((item) => item.id === selected?.id) ?? selected} onClose={() => setSelected(null)} />
    </div>
  );
}

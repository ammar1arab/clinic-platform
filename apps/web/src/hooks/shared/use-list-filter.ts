'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers';
import { useSessionStorageState } from './use-session-storage-state';

export function useListFilter<T>(
  items: T[] | undefined,
  searchFields: (item: T) => string[],
  pageSize = 10,
) {
  const pathname = usePathname();
  const { user } = useAuth();
  const scope = `${user?.clinicUserId ?? 'none'}:${pathname}:list`;
  const [search, setSearchRaw] = useSessionStorageState(`${scope}:search`, '');
  const [page, setPage] = useSessionStorageState(`${scope}:page`, 1);

  const term = search.trim().toLowerCase();
  const filtered =
    !items
      ? []
      : !term
        ? items
        : items.filter((item) =>
            searchFields(item).some((field) =>
              field?.toLowerCase().includes(term),
            ),
          );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return {
    search,
    setSearch: (value: string) => {
      setSearchRaw(value);
      setPage(1);
    },
    page: currentPage,
    setPage,
    pageCount,
    pageItems,
    totalItems: filtered.length,
    pageSize,
  };
}

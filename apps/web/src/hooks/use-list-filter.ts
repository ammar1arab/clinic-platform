'use client';

import { useMemo, useState } from 'react';
import { useDebounce } from './use-debounce';

export function useListFilter<T>(
  items: T[] | undefined,
  searchFields: (item: T) => string[],
  pageSize = 10,
) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 250);

  const filtered = useMemo(() => {
    if (!items) return [];
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      searchFields(item).some((field) => field?.toLowerCase().includes(term)),
    );
  }, [items, debouncedSearch, searchFields]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  const currentPage = Math.min(page, pageCount);

  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  return {
    search,
    setSearch: (value: string) => {
      setSearch(value);
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

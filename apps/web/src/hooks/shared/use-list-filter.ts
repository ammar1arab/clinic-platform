'use client';

import { useState } from 'react';
import { useDebounce } from './use-debounce';

export function useListFilter<T>(
  items: T[] | undefined,
  searchFields: (item: T) => string[],
  pageSize = 10,
) {
  const [search, setSearchRaw] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const term = debouncedSearch.trim().toLowerCase();
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

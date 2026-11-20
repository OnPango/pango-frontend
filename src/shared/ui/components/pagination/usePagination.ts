import { useMemo, useState } from 'react';

/**
 * Client-side pagination for a list that is already fully loaded.
 * For server-side pagination keep `page`/`pageSize` in your own state and send them to the API.
 */
export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // Derived, not stored: if the list shrinks (e.g. a filter) the page follows without an effect.
  const page = Math.min(requestedPage, totalPages);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const setPage = (next: number) => setRequestedPage(Math.min(Math.max(next, 1), totalPages));
  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setRequestedPage(1);
  };

  return { page, pageSize, totalItems, pageItems, setPage, setPageSize };
}

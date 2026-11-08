import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  WarehouseFilters,
  WarehouseStatusFilter,
  WarehouseType,
} from '../types/warehouses.types';

/** The list filters on every keystroke; the URL only takes the search once typing pauses. */
const URL_SEARCH_DELAY_MS = 400;

const STATUSES: readonly WarehouseStatusFilter[] = ['active', 'inactive', 'all'];
const TYPES: readonly (WarehouseType | 'all')[] = ['warehouse', 'store', 'all'];

const parse = <T extends string>(raw: string | null, valid: readonly T[], fallback: T): T =>
  valid.includes(raw as T) ? (raw as T) : fallback;

/**
 * Search, type and status of the warehouses list, kept in the URL so a reload or a shared link
 * shows the same view.
 */
export function useWarehouseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = (searchParams.get('search') ?? '').trim();
  const type = parse(searchParams.get('type'), TYPES, 'all');
  const status = parse(searchParams.get('status'), STATUSES, 'active');

  const setParam = useCallback(
    (key: string, value: string, fallback: string) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value.trim() === '' || value === fallback) next.delete(key);
          else next.set(key, value.trim());
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  // What the box shows, and the URL search it was typed against: when the URL changes from
  // outside (the sidebar link) the box follows it.
  const [input, setInput] = useState({ value: urlSearch, url: urlSearch });
  const search = input.url === urlSearch ? input.value : urlSearch;

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const setSearch = useCallback(
    (value: string) => {
      setInput({ value, url: urlSearch });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setInput((prev) => ({ ...prev, url: value.trim() }));
        setParam('search', value, '');
      }, URL_SEARCH_DELAY_MS);
    },
    [urlSearch, setParam],
  );

  const filters: WarehouseFilters = useMemo(
    () => ({ search, type, status }),
    [search, type, status],
  );

  return {
    search,
    setSearch,
    type,
    setType: useCallback(
      (next: WarehouseType | 'all') => setParam('type', next, 'all'),
      [setParam],
    ),
    status,
    setStatus: useCallback(
      (next: WarehouseStatusFilter) => setParam('status', next, 'active'),
      [setParam],
    ),
    filters,
    isFiltered: search.trim() !== '' || type !== 'all',
  };
}

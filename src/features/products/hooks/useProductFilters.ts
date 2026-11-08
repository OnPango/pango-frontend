import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters, ProductStatusFilter } from '../types/products.types';

export const ALL_CATEGORIES = 'all';

/** Page sizes the table offers; the URL can only pick one of these. */
export const PAGE_SIZES = [10, 25, 50] as const;

/** The list filters on every keystroke; the URL only takes the search once typing pauses. */
const URL_SEARCH_DELAY_MS = 400;

const VALID_STATUSES: readonly ProductStatusFilter[] = ['active', 'inactive', 'all'];

/** Values left out of the URL, so the plain `/products` is the default view. */
const DEFAULTS = {
  search: '',
  category: ALL_CATEGORIES,
  status: 'active',
  page: '1',
  pageSize: '25',
} as const;

type Param = keyof typeof DEFAULTS;

const parseStatus = (raw: string | null): ProductStatusFilter =>
  VALID_STATUSES.includes(raw as ProductStatusFilter) ? (raw as ProductStatusFilter) : 'active';

/** Family ids are numeric. */
const parseCategory = (raw: string | null) => (raw && /^\d+$/.test(raw) ? raw : ALL_CATEGORIES);

const parsePage = (raw: string | null) => {
  const page = Number.parseInt(raw ?? '', 10);
  return Number.isNaN(page) || page < 1 ? 1 : page;
};

const parsePageSize = (raw: string | null) => {
  const size = Number(raw);
  return (PAGE_SIZES as readonly number[]).includes(size) ? size : Number(DEFAULTS.pageSize);
};

/**
 * Search, family, status and page of the products list, kept in the URL so a reload or a shared
 * link shows the same view. The list follows the search box on every keystroke; the URL catches
 * up once typing pauses.
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = (searchParams.get('search') ?? '').trim();
  const category = parseCategory(searchParams.get('category'));
  const status = parseStatus(searchParams.get('status'));
  const page = parsePage(searchParams.get('page'));
  const pageSize = parsePageSize(searchParams.get('pageSize'));

  const setParams = useCallback(
    (updates: Partial<Record<Param, string | number>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            const text = String(value).trim();
            if (text === '' || text === DEFAULTS[key as Param]) next.delete(key);
            else next.set(key, text);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // What the box shows, and the URL search it was typed against. When the URL changes from
  // outside (the sidebar link, a shared link) the box follows the URL instead.
  const [input, setInput] = useState({ value: urlSearch, url: urlSearch });
  const search = input.url === urlSearch ? input.value : urlSearch;

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = useCallback(
    (value: string) => {
      clearTimeout(timer.current);
      const committed = value.trim();
      setInput((prev) => ({ ...prev, url: committed }));
      if (committed !== urlSearch) setParams({ search: committed, page: 1 });
    },
    [urlSearch, setParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      setInput({ value, url: urlSearch });
      // A new search starts on the first page, not on the one the previous search was showing.
      if (page > 1) setParams({ page: 1 });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => commit(value), URL_SEARCH_DELAY_MS);
    },
    [urlSearch, page, setParams, commit],
  );

  const setCategoryId = useCallback(
    (next: string) => setParams({ category: next, page: 1 }),
    [setParams],
  );
  const setStatus = useCallback(
    (next: ProductStatusFilter) => setParams({ status: next, page: 1 }),
    [setParams],
  );
  const setPage = useCallback((next: number) => setParams({ page: next }), [setParams]);
  const setPageSize = useCallback(
    (next: number) => setParams({ pageSize: next, page: 1 }),
    [setParams],
  );

  const filters: ProductFilters = useMemo(
    () => ({
      search,
      categoryId: category === ALL_CATEGORIES ? null : category,
      status,
      page,
      pageSize,
    }),
    [search, category, status, page, pageSize],
  );

  return {
    search,
    setSearch,
    categoryId: category,
    setCategoryId,
    status,
    setStatus,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    isFiltered: search.trim() !== '' || category !== ALL_CATEGORIES,
  };
}

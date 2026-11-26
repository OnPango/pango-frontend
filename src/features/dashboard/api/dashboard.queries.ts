import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LevelDays } from '../types/dashboard.types';
import {
  getImportedLevel,
  getImportedMovements,
  getInventoryLevel,
  getSummary,
} from './dashboard.api';

/**
 * Everything lives under `['dashboard']`. Registering movements, receiving transfers, attending
 * requests and changing alerts invalidate this root by name; otherwise the figures refresh on their
 * own after a minute.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (warehouseId: string | null) => [...dashboardKeys.all, 'summary', warehouseId] as const,
  level: (warehouseId: string | null, days: LevelDays) =>
    [...dashboardKeys.all, 'level', warehouseId, days] as const,
  importedLevel: (warehouseId: string | null, days: LevelDays) =>
    [...dashboardKeys.all, 'importedLevel', warehouseId, days] as const,
  importedMovements: (warehouseId: string | null) =>
    [...dashboardKeys.all, 'importedMovements', warehouseId] as const,
};

/** Switching warehouses keeps the previous figures on screen while the new ones load. */
const STALE_MS = 60_000;

export function useDashboardSummary(warehouseId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.summary(warehouseId),
    queryFn: () => getSummary(warehouseId),
    placeholderData: keepPreviousData,
    staleTime: STALE_MS,
  });
}

export function useInventoryLevel(warehouseId: string | null, days: LevelDays, enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.level(warehouseId, days),
    queryFn: () => getInventoryLevel(warehouseId, days),
    placeholderData: keepPreviousData,
    staleTime: STALE_MS,
    enabled,
  });
}

/** The level from the imported history; null when the API does not offer it. */
export function useImportedLevel(warehouseId: string | null, days: LevelDays, enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.importedLevel(warehouseId, days),
    queryFn: () => getImportedLevel(warehouseId, days),
    placeholderData: keepPreviousData,
    staleTime: STALE_MS,
    enabled,
  });
}

/** How many imported lines the dashboard lists. */
export const IMPORTED_MOVEMENTS_SHOWN = 6;

export function useImportedMovements(warehouseId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: dashboardKeys.importedMovements(warehouseId),
    queryFn: () => getImportedMovements(warehouseId, IMPORTED_MOVEMENTS_SHOWN),
    staleTime: STALE_MS,
    enabled,
  });
}

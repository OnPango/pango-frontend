import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { LevelDays } from '../types/dashboard.types';
import { getInventoryLevel, getSummary } from './dashboard.api';

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

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { StartRunInput, WarehouseForecastFilters } from '../types/forecast.types';
import {
  getDemand,
  getForecastProducts,
  getForecastRuns,
  getForecastWarehouses,
  getProductForecasts,
  getWarehouseForecasts,
  startForecastRun,
} from './forecast.api';

export const forecastKeys = {
  all: ['forecast'] as const,
  runs: () => [...forecastKeys.all, 'runs'] as const,
  runPage: (page: number, pageSize: number) => [...forecastKeys.runs(), page, pageSize] as const,
  latestRun: () => [...forecastKeys.runs(), 'latest'] as const,
  /** Demand and forecast results: refreshed when a run finishes. */
  results: () => [...forecastKeys.all, 'results'] as const,
  demand: (productId: string, warehouseId: string, from: string) =>
    [...forecastKeys.results(), 'demand', productId, warehouseId, from] as const,
  forecasts: (productId: string, warehouseId: string) =>
    [...forecastKeys.results(), 'forecasts', productId, warehouseId] as const,
  warehouse: (filters: WarehouseForecastFilters) =>
    [...forecastKeys.results(), 'warehouse', filters] as const,
  warehouses: () => [...forecastKeys.all, 'warehouses'] as const,
  products: () => [...forecastKeys.all, 'products'] as const,
};

export function useDemand(productId: string, warehouseId: string, from: string) {
  return useQuery({
    queryKey: forecastKeys.demand(productId, warehouseId, from),
    queryFn: () => getDemand(productId, warehouseId, from),
    enabled: productId !== '' && warehouseId !== '',
    placeholderData: keepPreviousData,
  });
}

export function useProductForecasts(productId: string, warehouseId: string) {
  return useQuery({
    queryKey: forecastKeys.forecasts(productId, warehouseId),
    queryFn: () => getProductForecasts(productId, warehouseId),
    enabled: productId !== '' && warehouseId !== '',
  });
}

export function useWarehouseForecasts(filters: WarehouseForecastFilters) {
  return useQuery({
    queryKey: forecastKeys.warehouse(filters),
    queryFn: () => getWarehouseForecasts(filters),
    enabled: filters.warehouseId !== '',
    placeholderData: keepPreviousData,
  });
}

export function useForecastRuns(page: number, pageSize: number, enabled: boolean) {
  return useQuery({
    queryKey: forecastKeys.runPage(page, pageSize),
    queryFn: () => getForecastRuns(page, pageSize),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** A run takes minutes: while one is running, its status is checked this often. */
const RUN_POLL_MS = 4000;

/**
 * The most recent run, polled while it runs. When it changes, the run list is read again; when it
 * finishes, so are the forecast results on screen.
 */
export function useLatestRun(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: forecastKeys.latestRun(),
    queryFn: async () => (await getForecastRuns(1, 1)).items[0] ?? null,
    enabled,
    refetchInterval: (q) => (q.state.data?.status === 'running' ? RUN_POLL_MS : false),
  });

  const run = query.data;
  const signature = run ? `${run.id}:${run.status}` : null;
  const previous = useRef<{ signature: string | null; running: boolean } | null>(null);
  useEffect(() => {
    const running = run?.status === 'running';
    const before = previous.current;
    previous.current = { signature, running };
    if (!before || before.signature === signature) return;
    void queryClient.invalidateQueries({
      queryKey: forecastKeys.runs(),
      predicate: (q) => q.queryKey[2] !== 'latest',
    });
    if (before.running && !running) {
      void queryClient.invalidateQueries({ queryKey: forecastKeys.results() });
    }
  }, [signature, run?.status, queryClient]);

  return query;
}

export function useStartForecastRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartRunInput) => startForecastRun(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: forecastKeys.runs() }),
  });
}

export function useForecastWarehouses(enabled: boolean) {
  return useQuery({
    queryKey: forecastKeys.warehouses(),
    queryFn: getForecastWarehouses,
    enabled,
    staleTime: 300_000,
  });
}

export function useForecastProducts(enabled: boolean) {
  return useQuery({
    queryKey: forecastKeys.products(),
    queryFn: getForecastProducts,
    enabled,
    staleTime: 300_000,
  });
}

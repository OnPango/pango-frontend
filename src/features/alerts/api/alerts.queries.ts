import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AlertFilters, AlertManualStatus } from '../types/alerts.types';
import {
  getAlert,
  getAlertProducts,
  getAlerts,
  getAlertWarehouses,
  getCurrentStock,
  setAlertStatus,
} from './alerts.api';

/**
 * Everything lives under `['alerts']`: movements, replenishment changes and stock requests
 * (inventory and requests features) open or resolve alerts, and invalidate that root by name.
 */
export const alertsKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertsKeys.all, 'list'] as const,
  list: (filters: AlertFilters) => [...alertsKeys.lists(), filters] as const,
  pending: () => [...alertsKeys.all, 'pending'] as const,
  detail: (id: string) => [...alertsKeys.all, 'detail', id] as const,
  current: (productId: string, warehouseId: string) =>
    [...alertsKeys.all, 'current', productId, warehouseId] as const,
  warehouses: () => [...alertsKeys.all, 'warehouses'] as const,
  products: () => [...alertsKeys.all, 'products'] as const,
};

export function useAlerts(filters: AlertFilters) {
  return useQuery({
    queryKey: alertsKeys.list(filters),
    queryFn: () => getAlerts(filters),
    placeholderData: keepPreviousData,
  });
}

/** How many alerts the bell lists; the count comes from the page's total. */
export const BELL_SIZE = 5;
/** Alerts are raised by other people's movements too: the bell checks again every two minutes. */
const BELL_REFRESH_MS = 120_000;

/** The most recent pending alerts and how many there are, for the header's bell. */
export function usePendingAlerts(enabled: boolean) {
  return useQuery({
    queryKey: alertsKeys.pending(),
    queryFn: () =>
      getAlerts({
        status: 'open',
        warehouseId: null,
        productId: null,
        page: 1,
        pageSize: BELL_SIZE,
      }),
    enabled,
    staleTime: 30_000,
    refetchInterval: BELL_REFRESH_MS,
  });
}

export function useAlert(id: string) {
  return useQuery({ queryKey: alertsKeys.detail(id), queryFn: () => getAlert(id) });
}

/** The product's stock now in the alert's warehouse; only with `stock.read` there. */
export function useCurrentStock(productId: string, warehouseId: string, enabled: boolean) {
  return useQuery({
    queryKey: alertsKeys.current(productId, warehouseId),
    queryFn: () => getCurrentStock(productId, warehouseId),
    enabled,
  });
}

export function useAlertWarehouses(enabled: boolean) {
  return useQuery({
    queryKey: alertsKeys.warehouses(),
    queryFn: getAlertWarehouses,
    enabled,
    staleTime: 300_000,
  });
}

export function useAlertProducts(enabled: boolean) {
  return useQuery({
    queryKey: alertsKeys.products(),
    queryFn: getAlertProducts,
    enabled,
    staleTime: 300_000,
  });
}

/**
 * US-045: marks an alert attended or pending again. Everything under `['alerts']` refreshes (lists,
 * the bell, the detail); the inventory shows the alert in force, so its root refreshes too.
 */
export function useSetAlertStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertManualStatus }) =>
      setAlertStatus(id, status),
    onSuccess: (alert) => {
      queryClient.setQueryData(alertsKeys.detail(alert.id), alert);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: alertsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        // "Stock bajo" and its list on the dashboard.
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}

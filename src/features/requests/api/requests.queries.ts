import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { FulfilInput, RequestFilters, StockRequest } from '../types/requests.types';
import {
  cancelRequest,
  createRequest,
  fulfilRequest,
  getDepartments,
  getLots,
  getRequest,
  getOpenWarehouses,
  getRequestableProducts,
  getRequests,
  getUserDepartment,
  rejectRequest,
  startRequest,
} from './requests.api';

export const requestsKeys = {
  all: ['stock-requests'] as const,
  lists: () => [...requestsKeys.all, 'list'] as const,
  list: (filters: RequestFilters) => [...requestsKeys.lists(), filters] as const,
  detail: (id: string) => [...requestsKeys.all, 'detail', id] as const,
  lots: (productId: string, warehouseId: string) =>
    [...requestsKeys.all, 'lots', productId, warehouseId] as const,
  products: () => [...requestsKeys.all, 'products'] as const,
  historyProducts: () => [...requestsKeys.all, 'products', 'all'] as const,
  warehouses: () => [...requestsKeys.all, 'warehouses'] as const,
  /** Under `['departments']`, so changes made in Áreas refresh it. */
  departments: () => ['departments', 'request-filter'] as const,
  myDepartment: (userId: string) => [...requestsKeys.all, 'my-department', userId] as const,
  /** The alerts feature's root (`['alerts']`): attending a request moves stock. */
  alerts: () => ['alerts'] as const,
  /** The movements feature's root (`['movements']`): fulfilling registers an outbound movement. */
  movements: () => ['movements'] as const,
};

/** `enabled: false` while the default filter (the user's area) is still unknown. */
export function useRequests(filters: RequestFilters, enabled = true) {
  return useQuery({
    queryKey: requestsKeys.list(filters),
    queryFn: () => getRequests(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/**
 * Loads a list the user is likely to open next (the other tab's default view) once `enabled`, so
 * switching to it shows it at once instead of waiting on the API.
 */
export function usePrefetchRequests(filters: RequestFilters, enabled: boolean) {
  const queryClient = useQueryClient();
  // By value: the caller builds a new object on every render.
  const key = JSON.stringify(filters);
  useEffect(() => {
    if (!enabled) return;
    const next = JSON.parse(key) as RequestFilters;
    void queryClient.prefetchQuery({
      queryKey: requestsKeys.list(next),
      queryFn: () => getRequests(next),
    });
  }, [enabled, key, queryClient]);
}

export function useRequestableProducts(enabled: boolean) {
  return useQuery({
    queryKey: requestsKeys.products(),
    queryFn: () => getRequestableProducts(),
    enabled,
  });
}

/** Every product, archived ones too: to filter the history (US-032). */
export function useHistoryProducts(enabled: boolean) {
  return useQuery({
    queryKey: requestsKeys.historyProducts(),
    queryFn: () => getRequestableProducts('ALL'),
    enabled,
  });
}

export function useOpenWarehouses(enabled: boolean) {
  return useQuery({ queryKey: requestsKeys.warehouses(), queryFn: getOpenWarehouses, enabled });
}

export function useRequestDepartments() {
  return useQuery({ queryKey: requestsKeys.departments(), queryFn: getDepartments });
}

/** The user's area when they may read users; otherwise unknown (`undefined`). */
export function useMyDepartment(userId: string | null, canReadUsers: boolean) {
  return useQuery({
    queryKey: requestsKeys.myDepartment(userId ?? ''),
    queryFn: () => getUserDepartment(userId ?? ''),
    enabled: userId !== null && canReadUsers,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequest,
    // Not awaited: the form closes as soon as the API confirms.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: requestsKeys.lists() }),
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelRequest,
    onSuccess: (request) => {
      queryClient.setQueryData(requestsKeys.detail(request.id), request);
      void queryClient.invalidateQueries({ queryKey: requestsKeys.lists() });
    },
  });
}

export function useRequest(id: string) {
  return useQuery({ queryKey: requestsKeys.detail(id), queryFn: () => getRequest(id) });
}

export function useRequestLots(productId: string, warehouseId: string, enabled: boolean) {
  return useQuery({
    queryKey: requestsKeys.lots(productId, warehouseId),
    queryFn: () => getLots(productId, warehouseId),
    enabled,
  });
}

/** After a transition: the detail shows the answer at once; the lists refetch behind it. */
function useTransition<T>(fn: (input: T) => Promise<StockRequest>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (request) => {
      queryClient.setQueryData(requestsKeys.detail(request.id), request);
      void queryClient.invalidateQueries({ queryKey: requestsKeys.lists() });
      // Stock and lots changed (reserved or taken out).
      void queryClient.invalidateQueries({ queryKey: [...requestsKeys.all, 'lots'] });
      // Reserving, releasing or taking stock out re-evaluates the alerts.
      void queryClient.invalidateQueries({ queryKey: requestsKeys.alerts() });
      void queryClient.invalidateQueries({ queryKey: requestsKeys.movements() });
    },
  });
}

export const useStartRequest = () => useTransition(startRequest);
export const useRejectRequest = () =>
  useTransition(({ id, reason }: { id: string; reason: string }) => rejectRequest(id, reason));
export const useFulfilRequest = () =>
  useTransition(({ id, input }: { id: string; input: FulfilInput }) => fulfilRequest(id, input));

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RequestFilters } from '../types/requests.types';
import {
  cancelRequest,
  createRequest,
  getDepartments,
  getOpenWarehouses,
  getRequestableProducts,
  getRequests,
  getUserDepartment,
} from './requests.api';

export const requestsKeys = {
  all: ['stock-requests'] as const,
  lists: () => [...requestsKeys.all, 'list'] as const,
  list: (filters: RequestFilters) => [...requestsKeys.lists(), filters] as const,
  products: () => [...requestsKeys.all, 'products'] as const,
  warehouses: () => [...requestsKeys.all, 'warehouses'] as const,
  /** Under `['departments']`, so changes made in Áreas refresh it. */
  departments: () => ['departments', 'request-filter'] as const,
  myDepartment: (userId: string) => [...requestsKeys.all, 'my-department', userId] as const,
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

export function useRequestableProducts(enabled: boolean) {
  return useQuery({ queryKey: requestsKeys.products(), queryFn: getRequestableProducts, enabled });
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
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: requestsKeys.lists() }),
  });
}

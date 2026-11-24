import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MovementFilters } from '../types/movements.types';
import {
  getHistoryProducts,
  getHistoryWarehouses,
  getMovement,
  getMovements,
  getMovementTypes,
  receiveTransfer,
} from './movements.api';

/**
 * Everything lives under `['movements']`: registering a movement (inventory) or fulfilling a
 * stock request (requests) adds to the history, and they invalidate that root by name.
 */
export const movementsKeys = {
  all: ['movements'] as const,
  lists: () => [...movementsKeys.all, 'list'] as const,
  list: (filters: MovementFilters) => [...movementsKeys.lists(), filters] as const,
  detail: (id: string) => [...movementsKeys.all, 'detail', id] as const,
  types: () => [...movementsKeys.all, 'types'] as const,
  warehouses: () => [...movementsKeys.all, 'warehouses'] as const,
  products: () => [...movementsKeys.all, 'products'] as const,
};

export function useMovements(filters: MovementFilters) {
  return useQuery({
    queryKey: movementsKeys.list(filters),
    queryFn: () => getMovements(filters),
    placeholderData: keepPreviousData,
  });
}

export function useMovement(id: string) {
  return useQuery({ queryKey: movementsKeys.detail(id), queryFn: () => getMovement(id) });
}

/**
 * Receiving adds stock to the destination: its stock (Inventario), its alerts and this history
 * change, and the dashboard with them. Other features' roots are named, not imported
 * (`['inventory']`, `['alerts']`, `['dashboard']`).
 */
export function useReceiveTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      received,
    }: {
      id: string;
      received: { lineNumber: number; quantity: number }[];
    }) => receiveTransfer(id, received),
    onSuccess: (movement) => {
      queryClient.setQueryData(movementsKeys.detail(movement.id), movement);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: movementsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['alerts'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
    },
  });
}

export function useMovementTypes() {
  return useQuery({
    queryKey: movementsKeys.types(),
    queryFn: getMovementTypes,
    staleTime: 300_000,
  });
}

export function useHistoryWarehouses(enabled: boolean) {
  return useQuery({
    queryKey: movementsKeys.warehouses(),
    queryFn: getHistoryWarehouses,
    enabled,
    staleTime: 300_000,
  });
}

export function useHistoryProducts(enabled: boolean) {
  return useQuery({
    queryKey: movementsKeys.products(),
    queryFn: getHistoryProducts,
    enabled,
    staleTime: 300_000,
  });
}

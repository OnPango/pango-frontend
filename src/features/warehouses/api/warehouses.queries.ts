import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateWarehouseInput } from '../types/warehouses.types';
import { createWarehouse, getWarehouses, updateWarehouse } from './warehouses.api';
import { warehousesKeys } from './warehouses.keys';

export function useWarehouses() {
  return useQuery({ queryKey: warehousesKeys.list(), queryFn: getWarehouses });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWarehouse,
    // `all`: other screens (users' role scopes) list warehouses under the same root key.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehousesKeys.all }),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWarehouseInput }) =>
      updateWarehouse(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: warehousesKeys.all }),
  });
}

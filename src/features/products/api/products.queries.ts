import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductCategory, ProductFilters } from '../types/products.types';
import {
  createCategory,
  createProduct,
  getCategories,
  getProducts,
  getUnitsOfMeasure,
} from './products.api';
import { productsKeys } from './products.keys';

/** One page of the catalog. The previous page stays on screen while the next one loads. */
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: productsKeys.list(filters),
    queryFn: () => getProducts(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({ queryKey: productsKeys.categories(), queryFn: getCategories });
}

/** Units never change at runtime (the backend seeds them). */
export function useUnitsOfMeasure() {
  return useQuery({
    queryKey: productsKeys.units(),
    queryFn: getUnitsOfMeasure,
    staleTime: Infinity,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      // The family's product count changed.
      void queryClient.invalidateQueries({ queryKey: productsKeys.categories() });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: (created) => {
      queryClient.setQueryData<ProductCategory[]>(productsKeys.categories(), (old = []) => [
        ...old,
        created,
      ]);
      void queryClient.invalidateQueries({ queryKey: productsKeys.categories() });
    },
  });
}

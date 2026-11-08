import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductCategory, ProductFilters, UpdateProductInput } from '../types/products.types';
import {
  createCategory,
  createProduct,
  getCategories,
  getProduct,
  getProducts,
  getUnitsOfMeasure,
  updateProduct,
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

/** One product with its lock state. Null: nothing to load. */
export function useProduct(id: string | null) {
  return useQuery({
    queryKey: productsKeys.detail(id ?? ''),
    queryFn: () => getProduct(id ?? ''),
    enabled: id !== null,
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

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: productsKeys.detail(id) });
      // Moving it to another family changes both product counts.
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

import type { ProductFilters } from '../types/products.types';

export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productsKeys.lists(), filters] as const,
  categories: () => ['categories'] as const,
  units: () => ['units-of-measure'] as const,
};

export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  catalog: () => [...productsKeys.lists(), 'catalog'] as const,
  detail: (id: string) => [...productsKeys.all, 'detail', id] as const,
  categories: () => ['categories'] as const,
  units: () => ['units-of-measure'] as const,
};

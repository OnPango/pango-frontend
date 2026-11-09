export const warehousesKeys = {
  all: ['warehouses'] as const,
  list: () => [...warehousesKeys.all, 'list'] as const,
};

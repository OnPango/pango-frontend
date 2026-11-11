export const inventoryKeys = {
  all: ['inventory'] as const,
  products: () => [...inventoryKeys.all, 'products'] as const,
  warehouseStock: (warehouseId: string) =>
    [...inventoryKeys.all, 'warehouse-stock', warehouseId] as const,
  stock: (productId: string) => [...inventoryKeys.all, 'stock', productId] as const,
  lots: (productId: string, warehouseId: string) =>
    [...inventoryKeys.all, 'lots', productId, warehouseId] as const,
  replenishment: (productId: string, warehouseId: string) =>
    [...inventoryKeys.all, 'replenishment', productId, warehouseId] as const,
  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
  movementTypes: (warehouseId: string) =>
    [...inventoryKeys.all, 'movement-types', warehouseId] as const,
};

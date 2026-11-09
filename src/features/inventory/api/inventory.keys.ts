export const inventoryKeys = {
  all: ['inventory'] as const,
  products: () => [...inventoryKeys.all, 'products'] as const,
  allProducts: () => [...inventoryKeys.all, 'products', 'all'] as const,
  warehouseStock: (warehouseId: string) =>
    [...inventoryKeys.all, 'warehouse-stock', warehouseId] as const,
  stock: (productId: string) => [...inventoryKeys.all, 'stock', productId] as const,
  replenishment: (productId: string, warehouseId: string) =>
    [...inventoryKeys.all, 'replenishment', productId, warehouseId] as const,
  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
  movementTypes: (warehouseId: string) =>
    [...inventoryKeys.all, 'movement-types', warehouseId] as const,
};

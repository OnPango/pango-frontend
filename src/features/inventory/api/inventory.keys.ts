export const inventoryKeys = {
  all: ['inventory'] as const,
  products: () => [...inventoryKeys.all, 'products'] as const,
  warehouseStock: (warehouseId: string) =>
    [...inventoryKeys.all, 'warehouse-stock', warehouseId] as const,
  stock: (productId: string) => [...inventoryKeys.all, 'stock', productId] as const,
  /** A product's stock in one warehouse, by lot (the adjustment form). */
  stockIn: (productId: string, warehouseId: string) =>
    [...inventoryKeys.productStockIn(productId), warehouseId] as const,
  /** Every warehouse's stock-by-lot of a product. */
  productStockIn: (productId: string) => [...inventoryKeys.all, 'stock-in', productId] as const,
  lots: (productId: string, warehouseId: string) =>
    [...inventoryKeys.productLots(productId), warehouseId] as const,
  /** Every warehouse's lots of a product. */
  productLots: (productId: string) => [...inventoryKeys.all, 'lots', productId] as const,
  replenishment: (productId: string, warehouseId: string) =>
    [...inventoryKeys.all, 'replenishment', productId, warehouseId] as const,
  warehouses: () => [...inventoryKeys.all, 'warehouses'] as const,
  movementTypes: (warehouseId: string) =>
    [...inventoryKeys.all, 'movement-types', warehouseId] as const,
  /** The alerts feature's root (`['alerts']`): stock changes here open or resolve its alerts. */
  alerts: () => ['alerts'] as const,
  /** The requests feature's lots of a product (`['stock-requests', 'lots', id]`): attending picks one. */
  requestLots: (productId: string) => ['stock-requests', 'lots', productId] as const,
  /** The movements feature's root (`['movements']`): a new movement joins its history. */
  movements: () => ['movements'] as const,
  /**
   * Transfers on their way to a warehouse. Under the movements root: receiving one there (in
   * Movimientos) invalidates that root, and this count with it.
   */
  incomingTransfers: (warehouseId: string) =>
    [...inventoryKeys.movements(), 'incoming', warehouseId] as const,
};

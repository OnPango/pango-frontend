import type {
  MovementType,
  ProductStock,
  RegisterAdjustmentInput,
  RegisteredMovement,
  RegisterMovementInput,
  RegisterTransferInput,
  Replenishment,
  StockProduct,
  WarehouseOption,
  WarehouseProductStock,
} from '../types/inventory.types';
import type {
  CreateMovementDto,
  MovementDto,
  MovementNatureDto,
  MovementTypeDto,
  ProductDetailDto,
  ProductDto,
  ReplenishmentDto,
  ValueSourceDto,
  WarehouseDto,
  WarehouseProductStockDto,
} from './inventory.dto';

const NATURE: Record<MovementNatureDto, MovementType['nature']> = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
};

export const toStockProduct = (dto: ProductDto): StockProduct => ({
  id: String(dto.id),
  sku: dto.sku,
  name: dto.name,
  unit: { code: dto.stockUnit.code, name: dto.stockUnit.name },
  family: dto.category.name,
  tracksLots: dto.tracksLots,
  isActive: dto.isActive,
});

export const toProductStock = (dto: ProductDetailDto): ProductStock => ({
  product: toStockProduct(dto),
  totalOnHand: dto.totalOnHand,
  warehouses: dto.warehouses.map((row) => ({
    warehouse: { id: String(row.warehouse.id), name: row.warehouse.name },
    onHand: row.onHand,
    safetyStock: row.safetyStock,
    reorderPoint: row.reorderPoint,
    source: toSource(row.valueSource),
  })),
});

const toSource = (dto: ValueSourceDto) => (dto === 'CALCULATED' ? 'calculated' : 'manual');

export const toReplenishment = (dto: ReplenishmentDto): Replenishment => ({
  onHand: dto.onHand,
  reserved: dto.reserved,
  available: dto.available,
  safetyStock: dto.safetyStock,
  reorderPoint: dto.reorderPoint,
  minStock: dto.minStock,
  maxStock: dto.maxStock,
  source: toSource(dto.valueSource),
  openAlert: dto.openAlert
    ? {
        severity: Math.min(3, Math.max(1, dto.openAlert.severity)) as 1 | 2 | 3,
        createdAt: dto.openAlert.createdAt,
      }
    : null,
});

export const toWarehouseOption = (dto: WarehouseDto): WarehouseOption => ({
  id: String(dto.id),
  name: dto.name,
  code: dto.code,
});

export const toMovementType = (dto: MovementTypeDto): MovementType => ({
  id: String(dto.id),
  name: dto.name,
  nature: NATURE[dto.nature],
  countsAsDemand: dto.countsAsDemand,
});

export const toCreateMovementDto = (input: RegisterMovementInput): CreateMovementDto => ({
  movementTypeId: Number(input.movementTypeId),
  warehouseId: Number(input.warehouseId),
  ...(input.documentRef?.trim() ? { documentRef: input.documentRef.trim() } : {}),
  lines: [
    {
      productId: Number(input.productId),
      quantity: input.quantity,
      ...(input.lotCode?.trim() ? { lotCode: input.lotCode.trim() } : {}),
    },
  ],
});

/** One line per location to take from on a decrease; a single line otherwise. */
export const toCreateAdjustmentDto = (input: RegisterAdjustmentInput): CreateMovementDto => ({
  movementTypeId: Number(input.movementTypeId),
  warehouseId: Number(input.warehouseId),
  notes: input.notes.trim(),
  ...(input.documentRef?.trim() ? { documentRef: input.documentRef.trim() } : {}),
  lines: input.lines.map((line) => ({
    productId: Number(input.productId),
    quantity: line.quantity,
    direction: input.direction === 'increase' ? 'INCREASE' : 'DECREASE',
    ...(input.lotCode?.trim() ? { lotCode: input.lotCode.trim() } : {}),
    ...(line.locationId ? { locationId: Number(line.locationId) } : {}),
  })),
});

/** One line per product (and lot), from the origin's default location to the destination's. */
export const toCreateTransferDto = (input: RegisterTransferInput): CreateMovementDto => ({
  movementTypeId: Number(input.movementTypeId),
  warehouseId: Number(input.originId),
  destinationWarehouseId: Number(input.destinationId),
  receiveNow: input.receiveNow,
  ...(input.documentRef?.trim() ? { documentRef: input.documentRef.trim() } : {}),
  ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  lines: input.lines.map((line) => ({
    productId: Number(line.productId),
    quantity: line.quantity,
    ...(line.lotCode?.trim() ? { lotCode: line.lotCode.trim() } : {}),
  })),
});

const KIND: Partial<Record<MovementNatureDto, RegisteredMovement['kind']>> = {
  OUTBOUND: 'outbound',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
};

export const toRegisteredMovement = (dto: MovementDto): RegisteredMovement => ({
  id: String(dto.id),
  number: dto.number,
  kind: KIND[dto.movementType.nature] ?? 'inbound',
  warehouse: { id: String(dto.warehouse.id), name: dto.warehouse.name },
  destination: dto.destinationWarehouse
    ? { id: String(dto.destinationWarehouse.id), name: dto.destinationWarehouse.name }
    : null,
  inTransit: dto.status === 'IN_TRANSIT',
  productId: String(dto.lines[0]?.product.id ?? ''),
  productIds: [...new Set(dto.lines.map((line) => String(line.product.id)))],
  quantity: Number(dto.lines.reduce((sum, line) => sum + line.quantity, 0).toFixed(4)),
  removes: dto.lines.some((line) => line.originLocation && !line.destinationLocation),
});

export const toWarehouseProductStock = (dto: WarehouseProductStockDto): WarehouseProductStock => ({
  productId: String(dto.product.id),
  warehouseId: String(dto.warehouse.id),
  onHand: dto.onHand,
  reserved: dto.reserved,
  available: dto.available,
  balances: dto.balances.map((balance) => ({
    locationId: String(balance.location.id),
    lot: balance.lot ? { code: balance.lot.code, expiryDate: balance.lot.expiryDate } : null,
    onHand: balance.onHand,
  })),
});

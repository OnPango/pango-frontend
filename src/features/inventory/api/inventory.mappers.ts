import type {
  MovementType,
  ProductStock,
  RegisteredMovement,
  RegisterMovementInput,
  Replenishment,
  StockProduct,
  WarehouseOption,
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

export const toRegisteredMovement = (dto: MovementDto): RegisteredMovement => ({
  id: String(dto.id),
  number: dto.number,
  kind: dto.movementType.nature === 'OUTBOUND' ? 'outbound' : 'inbound',
  warehouse: { id: String(dto.warehouse.id), name: dto.warehouse.name },
  productId: String(dto.lines[0]?.product.id ?? ''),
  quantity: dto.lines[0]?.quantity ?? 0,
});

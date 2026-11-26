import { dayBound } from '@/shared/lib/localDay';
import type {
  ImportedMovement,
  ImportedMovementCode,
  ImportedMovementFilters,
  Movement,
  MovementFilters,
  MovementNature,
  MovementTypeRef,
} from '../types/movements.types';
import type { HistoricalMovementDto, MovementDto, MovementTypeDto } from './movements.dto';

const NATURE: Record<MovementTypeDto['nature'], MovementNature> = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'transfer',
};

export const toMovementType = (dto: MovementTypeDto): MovementTypeRef => ({
  id: String(dto.id),
  name: dto.name,
  nature: NATURE[dto.nature],
  countsAsDemand: dto.countsAsDemand,
});

const STATUS: Record<MovementDto['status'], Movement['status']> = {
  CONFIRMED: 'confirmed',
  IN_TRANSIT: 'inTransit',
  DRAFT: 'draft',
  VOIDED: 'voided',
};

export function toMovement(dto: MovementDto): Movement {
  const transfer = dto.movementType.nature === 'TRANSFER';
  return {
    id: String(dto.id),
    number: dto.number,
    type: toMovementType(dto.movementType),
    status: STATUS[dto.status],
    warehouse: { id: String(dto.warehouse.id), name: dto.warehouse.name },
    destination: dto.destinationWarehouse
      ? { id: String(dto.destinationWarehouse.id), name: dto.destinationWarehouse.name }
      : null,
    registeredBy: dto.registeredBy.name,
    received: dto.receivedAt ? { by: dto.receivedBy?.name ?? null, at: dto.receivedAt } : null,
    source: dto.source === 'STOCK_REQUEST' ? 'stockRequest' : 'manual',
    department: dto.department
      ? { id: String(dto.department.id), name: dto.department.name }
      : null,
    documentRef: dto.documentRef,
    notes: dto.notes,
    occurredAt: dto.occurredAt,
    lines: dto.lines.map((line) => {
      // Stock leaves from an origin; it arrives at a destination. A transfer has both: it is
      // read from its origin, where it was registered.
      const removes =
        transfer || (line.originLocation !== null && line.destinationLocation === null);
      return {
        lineNumber: line.lineNumber,
        product: {
          id: String(line.product.id),
          sku: line.product.sku,
          name: line.product.name,
          // The unit comes as a code only; its name is only a fallback for unknown codes.
          unit: { code: line.product.unit, name: line.product.unit },
        },
        quantity: line.quantity,
        removes,
        lot: line.lot?.code ?? null,
        location: (removes ? line.originLocation : line.destinationLocation)?.code ?? null,
        receivedQuantity: line.receivedQuantity ?? null,
        unitCost: line.unitCost ?? 0,
      };
    }),
  };
}

export function toListQuery(filters: MovementFilters) {
  return {
    ...(filters.productId && { productId: Number(filters.productId) }),
    ...(filters.warehouseId && { warehouseId: Number(filters.warehouseId) }),
    ...(filters.incomingTo && { destinationWarehouseId: Number(filters.incomingTo) }),
    ...((filters.inTransit || filters.incomingTo) && { status: 'IN_TRANSIT' }),
    ...(filters.typeId && { movementTypeId: Number(filters.typeId) }),
    ...(filters.from && { from: dayBound(filters.from, false) }),
    ...(filters.to && { to: dayBound(filters.to, true) }),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export function toImportedMovement(dto: HistoricalMovementDto): ImportedMovement {
  return {
    id: String(dto.id),
    date: dto.date,
    code: dto.movementType as ImportedMovementCode,
    product: { ...dto.product, id: String(dto.product.id) },
    warehouse: { id: String(dto.warehouse.id), code: dto.warehouse.code, name: dto.warehouse.name },
    quantityIn: dto.quantityIn,
    quantityOut: dto.quantityOut,
    balance: dto.balance,
    documentRef: dto.documentRef,
    lotCode: dto.lotCode,
    unitCost: dto.unitCost,
    afterCutover: dto.afterCutover,
    source: {
      importId: String(dto.source.importId),
      system: dto.source.sourceNamespace,
      movementId: dto.source.externalMovementId,
      line: dto.source.lineNumber,
    },
  };
}

/** Query of `GET /historical-movements`: business days as they are, no time zone. */
export function toImportedQuery(filters: ImportedMovementFilters) {
  return {
    ...(filters.productId && { productId: Number(filters.productId) }),
    ...(filters.warehouseId && { warehouseId: Number(filters.warehouseId) }),
    ...(filters.code && { movementType: filters.code }),
    ...(filters.from && { from: filters.from }),
    ...(filters.to && { to: filters.to }),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

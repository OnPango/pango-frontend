import { dayBound } from '@/shared/lib/localDay';
import type {
  Movement,
  MovementFilters,
  MovementNature,
  MovementTypeRef,
} from '../types/movements.types';
import type { MovementDto, MovementTypeDto } from './movements.dto';

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

export function toMovement(dto: MovementDto): Movement {
  return {
    id: String(dto.id),
    number: dto.number,
    type: toMovementType(dto.movementType),
    warehouse: { id: String(dto.warehouse.id), name: dto.warehouse.name },
    registeredBy: dto.registeredBy.name,
    source: dto.source === 'STOCK_REQUEST' ? 'stockRequest' : 'manual',
    department: dto.department
      ? { id: String(dto.department.id), name: dto.department.name }
      : null,
    documentRef: dto.documentRef,
    notes: dto.notes,
    occurredAt: dto.occurredAt,
    lines: dto.lines.map((line) => {
      // Stock leaves from an origin; it arrives at a destination.
      const removes = line.originLocation !== null && line.destinationLocation === null;
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
      };
    }),
  };
}

export function toListQuery(filters: MovementFilters) {
  return {
    ...(filters.productId && { productId: Number(filters.productId) }),
    ...(filters.warehouseId && { warehouseId: Number(filters.warehouseId) }),
    ...(filters.typeId && { movementTypeId: Number(filters.typeId) }),
    ...(filters.from && { from: dayBound(filters.from, false) }),
    ...(filters.to && { to: dayBound(filters.to, true) }),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

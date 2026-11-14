/** Shapes of pango-core's movement responses (`docs/movements.md`). */

type NatureDto = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';

export interface MovementTypeDto {
  id: number;
  name: string;
  nature: NatureDto;
  countsAsDemand: boolean;
}

interface LocationRefDto {
  id: number;
  code: string;
}

export interface MovementDto {
  id: number;
  number: string;
  status: 'DRAFT' | 'IN_TRANSIT' | 'CONFIRMED' | 'VOIDED';
  source: 'MANUAL' | 'STOCK_REQUEST';
  movementType: MovementTypeDto;
  warehouse: { id: number; name: string };
  registeredBy: { id: number; name: string | null };
  department: { id: number; name: string } | null;
  documentRef: string | null;
  notes: string | null;
  occurredAt: string;
  lines: {
    lineNumber: number;
    /** `unit` is the stock unit's code. */
    product: { id: number; sku: string; name: string; unit: string };
    originLocation: LocationRefDto | null;
    destinationLocation: LocationRefDto | null;
    lot: { id: number; code: string } | null;
    quantity: number;
    unitCost: number;
  }[];
}

export interface MovementPageDto {
  items: MovementDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WarehouseDto {
  id: number;
  name: string;
}

export interface ProductPageDto {
  items: { id: number; sku: string; name: string }[];
  total: number;
}

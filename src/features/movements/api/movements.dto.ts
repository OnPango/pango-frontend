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
  /** Where it was registered; on transfers, the origin. */
  warehouse: { id: number; name: string };
  /** Transfers: where the stock goes. */
  destinationWarehouse: { id: number; name: string } | null;
  registeredBy: { id: number; name: string | null };
  /** Transfers: who received it; null while in transit. */
  receivedBy: { id: number; name: string | null } | null;
  receivedAt: string | null;
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
    /** On transfers, what was sent. */
    quantity: number;
    /** Transfers: what arrived (the rest was lost on the way); null while in transit. */
    receivedQuantity: number | null;
    unitCost: number;
  }[];
}

export interface MovementPageDto {
  items: MovementDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** `POST /movements/:id/receive`: only the lines that differ from what was sent. */
export interface ReceiveTransferDto {
  lines?: { lineNumber: number; receivedQuantity: number }[];
}

export interface WarehouseDto {
  id: number;
  name: string;
}

export interface ProductPageDto {
  items: { id: number; sku: string; name: string }[];
  total: number;
}

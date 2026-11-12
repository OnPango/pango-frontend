import type { UnitRef } from '@/shared/lib/units';

/** CU-08 / CU-09 status cycle: pending → in progress → fulfilled, or rejected / cancelled. */
export type RequestStatus = 'pending' | 'inProgress' | 'fulfilled' | 'rejected' | 'cancelled';

/**
 * RF-REQ-007. Only internal consumption counts as demand (RN-008) and, for now, the only one
 * pango-core accepts; the others are enabled later.
 */
export type RequestType = 'internalConsumption' | 'internalReplenishment' | 'return' | 'incident';

/** 1 is the highest. */
export type RequestPriority = 1 | 2 | 3;

export interface StockRequest {
  id: string;
  /** `SR-00000012`. */
  number: string;
  type: RequestType;
  status: RequestStatus;
  priority: RequestPriority;
  /** `YYYY-MM-DD`, or null when not given. */
  requiredDate: string | null;
  /** The warehouse that attends it. */
  warehouse: { id: string; name: string };
  /** The requesting area. */
  department: { id: string; name: string };
  requestedBy: { id: string; name: string | null };
  notes: string | null;
  rejectionReason: string | null;
  lines: {
    lineNumber: number;
    product: { id: string; sku: string; name: string; unit: UnitRef };
    quantity: number;
    /** Held while the request is in attention. */
    reserved: number;
  }[];
  /** The outbound movement that fulfilled it (source "stock request"). */
  movement: { id: string; number: string } | null;
  /** RF-REQ-003: every status change, oldest first, with who and when. */
  events: { status: RequestStatus; by: string | null; reason: string | null; at: string }[];
  createdAt: string;
}

/** A lot of a product with stock in the attending warehouse. */
export interface RequestLot {
  code: string;
  expiryDate: string | null;
  onHand: number;
}

/** "Confirmar consumo": the lot each per-lot line takes stock from. */
export interface FulfilInput {
  lines: { lineNumber: number; lotCode: string }[];
}

export interface RequestPage {
  items: StockRequest[];
  total: number;
}

export interface RequestFilters {
  /** Null: every area the user can see. */
  departmentId: string | null;
  /** Null: every warehouse the user can see. */
  warehouseId: string | null;
  status: RequestStatus | null;
  page: number;
  pageSize: number;
}

export interface CreateRequestInput {
  type: RequestType;
  warehouseId: string;
  priority: RequestPriority;
  requiredDate: string | null;
  notes: string | null;
  lines: { productId: string; quantity: number }[];
}

/** A product that can be requested. */
export interface RequestableProduct {
  id: string;
  sku: string;
  name: string;
  unit: UnitRef;
  /** Its stock is kept per lot: fulfilling it takes a lot. */
  tracksLots: boolean;
}

export interface Option {
  id: string;
  name: string;
}

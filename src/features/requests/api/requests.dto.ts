/** Bodies of the stock request endpoints (`docs/stock-requests.md` in pango-core). */

export type RequestTypeDto =
  'INTERNAL_CONSUMPTION' | 'INTERNAL_REPLENISHMENT' | 'RETURN' | 'INCIDENT';

export type RequestStatusDto = 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'REJECTED' | 'CANCELLED';

export interface StockRequestDto {
  id: number;
  number: string;
  type: RequestTypeDto;
  status: RequestStatusDto;
  priority: number;
  requiredDate: string | null;
  warehouse: { id: number; name: string };
  department: { id: number; name: string };
  requestedBy: { id: number; name: string | null };
  notes: string | null;
  rejectionReason: string | null;
  lines: {
    lineNumber: number;
    product: { id: number; sku: string; name: string; unit: string };
    requestedQuantity: number;
    reservedQuantity: number;
  }[];
  movement: { id: number; number: string } | null;
  events: {
    status: RequestStatusDto;
    changedBy: { id: number; name: string | null };
    reason: string | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface StockRequestPageDto {
  items: StockRequestDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateStockRequestDto {
  warehouseId: number;
  type: RequestTypeDto;
  priority: number;
  requiredDate?: string;
  notes?: string;
  lines: { productId: number; quantity: number }[];
}

/** `GET /products` (only what the request form needs). */
export interface ProductPageDto {
  items: {
    id: number;
    sku: string;
    name: string;
    stockUnit: { code: string; name: string };
    tracksLots: boolean;
  }[];
  total: number;
}

export interface WarehouseDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface DepartmentDto {
  id: number;
  name: string;
  isActive: boolean;
}

/** `GET /users/:id` (only the area). */
export interface UserDto {
  department: { id: number; name: string } | null;
}

/** `GET /products/:id/lots`. */
export interface LotDto {
  id: number;
  code: string;
  expiryDate: string | null;
  onHand: number;
}

/** `POST /stock-requests/:id/fulfil`. */
export interface FulfilStockRequestDto {
  lines: { lineNumber: number; lotCode: string }[];
}

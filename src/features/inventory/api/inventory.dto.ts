/**
 * Bodies of the endpoints the stock screens use (`docs/catalog.md`, `docs/warehouses.md`,
 * `docs/movements.md` in pango-core), only with the fields they read.
 */

export interface UnitDto {
  id: number;
  code: string;
  name: string;
}

/** A product in `GET /products`. */
export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  stockUnit: UnitDto;
  category: { id: number; name: string };
  tracksLots: boolean;
  isActive: boolean;
}

export interface ProductPageDto {
  items: ProductDto[];
  total: number;
}

/** `GET /products/:id`. */
export interface ProductDetailDto extends ProductDto {
  totalOnHand: number;
  warehouses: { warehouse: { id: number; name: string }; onHand: number }[];
}

/** `GET /warehouses`. */
export interface WarehouseDto {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export type MovementNatureDto = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';

/** `GET /movement-types`. */
export interface MovementTypeDto {
  id: number;
  name: string;
  nature: MovementNatureDto;
  countsAsDemand: boolean;
}

/** `POST /movements`. */
export interface CreateMovementDto {
  movementTypeId: number;
  warehouseId: number;
  documentRef?: string;
  lines: { productId: number; quantity: number; lotCode?: string }[];
}

/** The answer of `POST /movements` (only what the screen reads). */
export interface MovementDto {
  id: number;
  number: string;
  movementType: { id: number; name: string; nature: MovementNatureDto };
  warehouse: { id: number; name: string };
  lines: { product: { id: number }; quantity: number }[];
}

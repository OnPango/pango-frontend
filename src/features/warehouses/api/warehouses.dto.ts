/**
 * Bodies of the warehouse endpoints (`docs/warehouses.md` in pango-core), as the API names them.
 * Only `warehouses.mappers.ts` and `warehouses.api.ts` know these shapes.
 */

export type WarehouseTypeDto = 'WAREHOUSE' | 'STORE';

/** `GET /warehouses`, `GET /warehouses/:id` and the answers of `POST` / `PATCH`. */
export interface WarehouseDto {
  id: number;
  code: string;
  name: string;
  type: WarehouseTypeDto;
  address: string | null;
  defaultLocation: { id: number; code: string } | null;
  holdsStock: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  type: WarehouseTypeDto;
  address?: string | null;
  /** Defaults to true. */
  holdsStock?: boolean;
}

export type UpdateWarehouseDto = Partial<CreateWarehouseDto> & { isActive?: boolean };

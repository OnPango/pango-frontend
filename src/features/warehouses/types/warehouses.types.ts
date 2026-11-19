/** `bodega` (storage) or `tienda` (point of sale). */
export type WarehouseType = 'warehouse' | 'store';

export interface Warehouse {
  id: string;
  /** Short code, unique in the organization. */
  code: string;
  name: string;
  type: WarehouseType;
  address: string | null;
  /** Created with the warehouse: stock goes here until locations exist (S6). */
  defaultLocation: { id: string; code: string } | null;
  /** False: it never keeps stock of its own (e.g. sells to order), so it is left out of the forecast. */
  holdsStock: boolean;
  /** False: closed (warehouses are never deleted). */
  isActive: boolean;
  createdAt: string;
}

export type WarehouseStatusFilter = 'active' | 'inactive' | 'all';

export interface WarehouseFilters {
  /** Matches code or name. */
  search: string;
  type: WarehouseType | 'all';
  status: WarehouseStatusFilter;
}

export interface CreateWarehouseInput {
  code: string;
  name: string;
  type: WarehouseType;
  address: string | null;
  holdsStock: boolean;
}

/** `PATCH /warehouses/:id`: only what changed; `isActive: false` closes it. */
export type UpdateWarehouseInput = Partial<CreateWarehouseInput> & { isActive?: boolean };

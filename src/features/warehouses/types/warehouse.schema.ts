import { z } from 'zod';
import type { Warehouse } from './warehouses.types';

/** "Nuevo almacén" / "Editar almacén". Limits mirror `CreateWarehouseDto` in pango-core. */
export const warehouseSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del almacén.').max(80, 'Máximo 80 caracteres.'),
  code: z.string().trim().min(1, 'Escribe el código del almacén.').max(20, 'Máximo 20 caracteres.'),
  type: z.enum(['warehouse', 'store']),
  address: z.string().trim().max(200, 'Máximo 200 caracteres.'),
});

export type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export const EMPTY_WAREHOUSE_FORM: WarehouseFormValues = {
  name: '',
  code: '',
  type: 'warehouse',
  address: '',
};

export const toWarehouseFormValues = (warehouse: Warehouse): WarehouseFormValues => ({
  name: warehouse.name,
  code: warehouse.code,
  type: warehouse.type,
  address: warehouse.address ?? '',
});

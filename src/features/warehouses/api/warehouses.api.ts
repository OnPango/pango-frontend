import { http } from '@/core/api/http';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  Warehouse,
} from '../types/warehouses.types';
import type { WarehouseDto } from './warehouses.dto';
import { toCreateWarehouseDto, toUpdateWarehouseDto, toWarehouse } from './warehouses.mappers';

/**
 * Every call to the warehouse endpoints. A user sees the warehouses where a role grants
 * `warehouse.read`; holders of `warehouse.manage` see all of them.
 */

/**
 * `GET /warehouses?status=ALL`: open and closed, sorted by name. The list is not paged, so the
 * page searches and filters it in the browser.
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses', { params: { status: 'ALL' } });
  return data.map(toWarehouse);
}

/** `POST /warehouses`: also creates its default location. */
export async function createWarehouse(input: CreateWarehouseInput): Promise<Warehouse> {
  const { data } = await http.post<WarehouseDto>('/warehouses', toCreateWarehouseDto(input));
  return toWarehouse(data);
}

/** `PATCH /warehouses/:id`: edit, close (`isActive: false`, needs no stock) or reopen. */
export async function updateWarehouse(id: string, input: UpdateWarehouseInput): Promise<Warehouse> {
  const { data } = await http.patch<WarehouseDto>(`/warehouses/${id}`, toUpdateWarehouseDto(input));
  return toWarehouse(data);
}

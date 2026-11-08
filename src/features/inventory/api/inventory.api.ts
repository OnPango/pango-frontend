import { http } from '@/core/api/http';
import type {
  MovementType,
  ProductStock,
  RegisteredMovement,
  RegisterMovementInput,
  StockProduct,
  WarehouseOption,
} from '../types/inventory.types';
import type {
  MovementDto,
  MovementTypeDto,
  ProductDetailDto,
  ProductPageDto,
  WarehouseDto,
} from './inventory.dto';
import {
  toCreateMovementDto,
  toMovementType,
  toProductStock,
  toRegisteredMovement,
  toStockProduct,
  toWarehouseOption,
} from './inventory.mappers';

/** The most `GET /products` gives per page. */
const MAX_PAGE_SIZE = 100;

/** Every product with the given status; the first page says how many follow, asked for together. */
async function getCatalog(status: 'ACTIVE' | 'ALL'): Promise<StockProduct[]> {
  const page = async (n: number) =>
    (
      await http.get<ProductPageDto>('/products', {
        params: { status, page: n, pageSize: MAX_PAGE_SIZE },
      })
    ).data;
  const first = await page(1);
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => page(index + 2)),
  );
  return [first, ...rest].flatMap((p) => p.items).map(toStockProduct);
}

/** Active products, to pick one by code or name (CU-05, step 2). */
export const getActiveProducts = () => getCatalog('ACTIVE');

/** Active and archived: an archived product can still hold stock. */
export const getAllProducts = () => getCatalog('ALL');

/** `GET /products/:id`: the total and the stock per warehouse (US-015). */
export async function getProductStock(id: string): Promise<ProductStock> {
  const { data } = await http.get<ProductDetailDto>(`/products/${id}`);
  return toProductStock(data);
}

/** `GET /warehouses`: the open warehouses the user can see. */
export async function getWarehouses(): Promise<WarehouseOption[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses');
  return data.filter((warehouse) => warehouse.isActive).map(toWarehouseOption);
}

/** `GET /movement-types?warehouseId=`: only the types the user's roles allow there. */
export async function getMovementTypes(warehouseId: string): Promise<MovementType[]> {
  const { data } = await http.get<MovementTypeDto[]>('/movement-types', {
    params: { warehouseId: Number(warehouseId) },
  });
  return data.map(toMovementType);
}

/** `POST /movements`: confirmed at once; the stock changes in the same operation. */
export async function registerMovement(input: RegisterMovementInput): Promise<RegisteredMovement> {
  const { data } = await http.post<MovementDto>('/movements', toCreateMovementDto(input));
  return toRegisteredMovement(data);
}

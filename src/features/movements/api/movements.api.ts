import { http } from '@/core/api/http';
import type {
  HistoryProduct,
  Movement,
  MovementFilters,
  MovementPage,
  MovementTypeRef,
  Option,
} from '../types/movements.types';
import type {
  MovementDto,
  MovementPageDto,
  MovementTypeDto,
  ProductPageDto,
  ReceiveTransferDto,
  WarehouseDto,
} from './movements.dto';
import { toListQuery, toMovement, toMovementType } from './movements.mappers';

/**
 * `GET /movements`, most recent first (US-014): the movements of the warehouses where the user
 * holds `movement.read`. With a product, the movements that have a line of it.
 */
export async function getMovements(filters: MovementFilters): Promise<MovementPage> {
  const { data } = await http.get<MovementPageDto>('/movements', {
    params: toListQuery(filters),
  });
  return { items: data.items.map(toMovement), total: data.total };
}

/** `GET /movements/:id`; `404 MOVEMENT_NOT_FOUND` when it does not exist or is not readable. */
export async function getMovement(id: string): Promise<Movement> {
  const { data } = await http.get<MovementDto>(`/movements/${id}`);
  return toMovement(data);
}

/**
 * `POST /movements/:id/receive` (CU-16): what arrived is added to the destination and the transfer
 * is confirmed. `received` lists only the lines that differ from what was sent.
 */
export async function receiveTransfer(
  id: string,
  received: { lineNumber: number; quantity: number }[],
): Promise<Movement> {
  const body: ReceiveTransferDto =
    received.length > 0
      ? {
          lines: received.map((line) => ({
            lineNumber: line.lineNumber,
            receivedQuantity: line.quantity,
          })),
        }
      : {};
  // Like registering a movement, it locks rows and re-evaluates alerts: it can take a while.
  const { data } = await http.post<MovementDto>(`/movements/${id}/receive`, body, {
    timeout: 60_000,
  });
  return toMovement(data);
}

/** `GET /movement-types`: every type of the organization, for the filter. */
export async function getMovementTypes(): Promise<MovementTypeRef[]> {
  const { data } = await http.get<MovementTypeDto[]>('/movement-types');
  return data.map(toMovementType);
}

/** `GET /warehouses?status=ALL`: closed ones too, their history stays. */
export async function getHistoryWarehouses(): Promise<Option[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses', { params: { status: 'ALL' } });
  return data
    .map((w) => ({ id: String(w.id), name: w.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

const MAX_PAGE_SIZE = 100;

/** Every product, archived ones too: an archived product keeps its history. */
export async function getHistoryProducts(): Promise<HistoryProduct[]> {
  const page = async (n: number) =>
    (
      await http.get<ProductPageDto>('/products', {
        params: { status: 'ALL', page: n, pageSize: MAX_PAGE_SIZE },
      })
    ).data;
  const first = await page(1);
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => page(index + 2)),
  );
  return [first, ...rest]
    .flatMap((p) => p.items)
    .map((dto) => ({ id: String(dto.id), sku: dto.sku, name: dto.name }));
}

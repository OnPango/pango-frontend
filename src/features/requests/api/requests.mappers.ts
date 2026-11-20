import { dayBound } from '@/shared/lib/localDay';
import type {
  CreateRequestInput,
  RequestFilters,
  RequestPriority,
  RequestStatus,
  RequestType,
  StockRequest,
} from '../types/requests.types';
import type {
  CreateStockRequestDto,
  RequestStatusDto,
  RequestTypeDto,
  StockRequestDto,
} from './requests.dto';

const STATUS: Record<RequestStatusDto, RequestStatus> = {
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};
const STATUS_DTO = Object.fromEntries(
  Object.entries(STATUS).map(([dto, status]) => [status, dto]),
) as Record<RequestStatus, RequestStatusDto>;

const TYPE: Record<RequestTypeDto, RequestType> = {
  INTERNAL_CONSUMPTION: 'internalConsumption',
  INTERNAL_REPLENISHMENT: 'internalReplenishment',
  RETURN: 'return',
  INCIDENT: 'incident',
};
const TYPE_DTO = Object.fromEntries(
  Object.entries(TYPE).map(([dto, type]) => [type, dto]),
) as Record<RequestType, RequestTypeDto>;

export const toStockRequest = (dto: StockRequestDto): StockRequest => ({
  id: String(dto.id),
  number: dto.number,
  type: TYPE[dto.type] ?? 'internalConsumption',
  status: STATUS[dto.status],
  priority: Math.min(3, Math.max(1, dto.priority)) as RequestPriority,
  requiredDate: dto.requiredDate,
  warehouse: { id: String(dto.warehouse.id), name: dto.warehouse.name },
  department: { id: String(dto.department.id), name: dto.department.name },
  requestedBy: { id: String(dto.requestedBy.id), name: dto.requestedBy.name },
  notes: dto.notes,
  rejectionReason: dto.rejectionReason,
  lines: dto.lines.map((line) => ({
    lineNumber: line.lineNumber,
    // The unit comes as a code only; its name is only a fallback for unknown codes.
    product: {
      id: String(line.product.id),
      sku: line.product.sku,
      name: line.product.name,
      unit: { code: line.product.unit, name: line.product.unit },
    },
    quantity: line.requestedQuantity,
    reserved: line.reservedQuantity,
  })),
  movement: dto.movement ? { id: String(dto.movement.id), number: dto.movement.number } : null,
  events: (dto.events ?? []).map((event) => ({
    status: STATUS[event.status],
    by: event.changedBy.name,
    reason: event.reason,
    at: event.createdAt,
  })),
  createdAt: dto.createdAt,
});

/** One status at a time: the API takes a single one (`active` is resolved by the caller). */
export const toListQuery = (
  filters: Omit<RequestFilters, 'status'> & { status: RequestStatus | null },
) => ({
  ...(filters.departmentId ? { departmentId: Number(filters.departmentId) } : {}),
  ...(filters.warehouseId ? { warehouseId: Number(filters.warehouseId) } : {}),
  ...(filters.status ? { status: STATUS_DTO[filters.status] } : {}),
  ...(filters.productId ? { productId: Number(filters.productId) } : {}),
  ...(filters.from ? { from: dayBound(filters.from, false) } : {}),
  ...(filters.to ? { to: dayBound(filters.to, true) } : {}),
  page: filters.page,
  pageSize: filters.pageSize,
});

export const toCreateRequestDto = (input: CreateRequestInput): CreateStockRequestDto => ({
  warehouseId: Number(input.warehouseId),
  type: TYPE_DTO[input.type],
  priority: input.priority,
  ...(input.requiredDate ? { requiredDate: input.requiredDate } : {}),
  ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  lines: input.lines.map((line) => ({
    productId: Number(line.productId),
    quantity: line.quantity,
  })),
});

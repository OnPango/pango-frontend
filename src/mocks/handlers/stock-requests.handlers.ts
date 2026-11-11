import { areas, findUserById } from '../db';
import { authorize, error } from '../guard';
import { numericId } from '../ids';
import type { MockRoutes } from '../server';
import { findProductRow, findUnitRow } from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * Internal stock requests of pango-core (`docs/stock-requests.md`): created `PENDING` (stock does
 * not change), listed most recent first, cancelled by the requester while still pending. Attending
 * them (start, fulfil, reject) is not mocked yet. In memory: a reload starts over.
 */

type Status = 'PENDING' | 'IN_PROGRESS' | 'FULFILLED' | 'REJECTED' | 'CANCELLED';

interface RequestRow {
  id: number;
  organizationId: string;
  status: Status;
  priority: number;
  requiredDate: string | null;
  warehouseId: number;
  departmentId: string;
  requestedById: string;
  notes: string | null;
  lines: { productId: number; quantity: number }[];
  events: { status: Status; userId: string; reason: string | null; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

const requests: RequestRow[] = [];

const userRef = (id: string) => ({ id: numericId(id), name: findUserById(id)?.full_name ?? null });

function toDto(row: RequestRow) {
  const warehouse = findWarehouseRow(row.organizationId, row.warehouseId);
  const area = areas.find((a) => a.id === row.departmentId);
  return {
    id: row.id,
    number: `SR-${String(row.id).padStart(8, '0')}`,
    type: 'INTERNAL_CONSUMPTION',
    status: row.status,
    priority: row.priority,
    requiredDate: row.requiredDate,
    warehouse: { id: row.warehouseId, name: warehouse?.name ?? '' },
    department: { id: numericId(row.departmentId), name: area?.name ?? '' },
    requestedBy: userRef(row.requestedById),
    notes: row.notes,
    rejectionReason: null,
    movement: null,
    lines: row.lines.map((line, index) => {
      const product = findProductRow(row.organizationId, line.productId)!;
      return {
        lineNumber: index + 1,
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          unit: findUnitRow(product.stockUnitId)?.code ?? '',
        },
        requestedQuantity: line.quantity,
        reservedQuantity: 0,
      };
    }),
    events: row.events.map((event) => ({
      status: event.status,
      changedBy: userRef(event.userId),
      reason: event.reason,
      createdAt: event.createdAt,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const decimals = (value: number) => (String(value).split('.')[1] ?? '').length;

export const stockRequestsRoutes: MockRoutes = {
  'GET /stock-requests': ({ query }) => {
    const auth = authorize('stock_request.read', 'stock_request.create', 'stock_request.approve');
    if (auth.error) return auth.error;
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25)));
    const list = requests
      .filter((row) => row.organizationId === auth.user.organization_id)
      .filter(
        (row) => !query.departmentId || numericId(row.departmentId) === Number(query.departmentId),
      )
      .filter((row) => !query.warehouseId || row.warehouseId === Number(query.warehouseId))
      .filter((row) => !query.status || row.status === query.status)
      .sort((a, b) => b.id - a.id);
    return {
      status: 200,
      data: {
        items: list.slice((page - 1) * pageSize, page * pageSize).map(toDto),
        total: list.length,
        page,
        pageSize,
      },
    };
  },

  'GET /stock-requests/:id': ({ params }) => {
    const auth = authorize('stock_request.read', 'stock_request.create', 'stock_request.approve');
    if (auth.error) return auth.error;
    const row = requests.find(
      (r) => r.organizationId === auth.user.organization_id && r.id === Number(params.id),
    );
    if (!row) return error(404, 'STOCK_REQUEST_NOT_FOUND', 'Stock request not found');
    return { status: 200, data: toDto(row) };
  },

  'POST /stock-requests': ({ body }) => {
    const auth = authorize('stock_request.create');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const input = (body ?? {}) as {
      warehouseId?: unknown;
      type?: unknown;
      priority?: unknown;
      requiredDate?: unknown;
      notes?: unknown;
      lines?: { productId?: unknown; quantity?: unknown }[];
    };
    const lines = Array.isArray(input.lines) ? input.lines : [];
    const problems: string[] = [];
    if (!Number.isInteger(input.warehouseId))
      problems.push('warehouseId must be an integer number');
    if (
      input.priority !== undefined &&
      (!Number.isInteger(input.priority) ||
        (input.priority as number) < 1 ||
        (input.priority as number) > 3)
    ) {
      problems.push('priority must not be greater than 3');
    }
    if (
      input.requiredDate !== undefined &&
      (typeof input.requiredDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.requiredDate))
    ) {
      problems.push('requiredDate must be a valid ISO 8601 date string');
    }
    if (typeof input.notes === 'string' && input.notes.length > 2000) {
      problems.push('notes must be shorter than or equal to 2000 characters');
    }
    if (lines.length < 1 || lines.length > 200)
      problems.push('lines must contain between 1 and 200 elements');
    lines.forEach((line, index) => {
      const q = line.quantity;
      if (typeof q !== 'number' || q < 0.0001 || decimals(q) > 4) {
        problems.push(`lines.${index}.quantity must not be less than 0.0001`);
      }
    });
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));

    if (input.type !== undefined && input.type !== 'INTERNAL_CONSUMPTION') {
      return error(
        400,
        'STOCK_REQUEST_TYPE_NOT_SUPPORTED',
        'Only internal consumption requests are supported',
      );
    }
    const area = areas.find((a) => a.id === auth.user.area_id);
    if (!area || area.is_active === false) {
      return error(
        400,
        'DEPARTMENT_REQUIRED',
        'You must belong to an active department to request stock',
      );
    }
    const warehouse = findWarehouseRow(org, input.warehouseId as number);
    if (!warehouse?.isActive) {
      return error(400, 'WAREHOUSE_INVALID', 'The warehouse does not exist or is inactive');
    }
    const seen = new Set<number>();
    for (const [index, line] of lines.entries()) {
      const product = findProductRow(org, Number(line.productId));
      if (!product?.isActive) {
        return error(
          400,
          'PRODUCT_INVALID',
          `Line ${index + 1}: the product does not exist or is inactive`,
        );
      }
      if (seen.has(product.id)) {
        return error(
          400,
          'PRODUCT_DUPLICATED',
          `Line ${index + 1}: the product is already in the request`,
        );
      }
      seen.add(product.id);
    }

    const now = new Date().toISOString();
    const row: RequestRow = {
      id: requests.reduce((max, r) => Math.max(max, r.id), 0) + 1,
      organizationId: org,
      status: 'PENDING',
      priority: (input.priority as number | undefined) ?? 2,
      requiredDate: (input.requiredDate as string | undefined) ?? null,
      warehouseId: warehouse.id,
      departmentId: area.id,
      requestedById: auth.user.id,
      notes: typeof input.notes === 'string' ? input.notes.trim() || null : null,
      lines: lines.map((line) => ({
        productId: Number(line.productId),
        quantity: line.quantity as number,
      })),
      events: [{ status: 'PENDING', userId: auth.user.id, reason: null, createdAt: now }],
      createdAt: now,
      updatedAt: now,
    };
    requests.push(row);
    return { status: 201, data: toDto(row) };
  },

  'POST /stock-requests/:id/cancel': ({ params }) => {
    const auth = authorize('stock_request.read', 'stock_request.create', 'stock_request.approve');
    if (auth.error) return auth.error;
    const row = requests.find(
      (r) => r.organizationId === auth.user.organization_id && r.id === Number(params.id),
    );
    if (!row) return error(404, 'STOCK_REQUEST_NOT_FOUND', 'Stock request not found');
    if (row.requestedById !== auth.user.id) {
      return error(403, 'NOT_REQUESTER', 'Only the requester can cancel the request');
    }
    if (row.status !== 'PENDING') {
      return error(
        409,
        'STOCK_REQUEST_STATUS_INVALID',
        `A ${row.status} request cannot be cancelled`,
      );
    }
    const now = new Date().toISOString();
    row.status = 'CANCELLED';
    row.events.push({ status: 'CANCELLED', userId: auth.user.id, reason: null, createdAt: now });
    row.updatedAt = now;
    return { status: 200, data: toDto(row) };
  },
};

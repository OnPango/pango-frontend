import { areas, findUserById } from '../db';
import { authorize, error } from '../guard';
import {
  applyStock,
  evaluateAlert,
  lotExists,
  onHand,
  release,
  reserve,
  reservedOf,
  stockByWarehouse,
} from '../stock';
import { recordMovement } from './movements.handlers';
import { numericId } from '../ids';
import type { MockResponse, MockRoutes } from '../server';
import { findProductRow, findUnitRow } from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * Internal stock requests of pango-core (`docs/stock-requests.md`): created `PENDING` (stock does
 * not change), listed most recent first, cancelled by the requester while still pending, and
 * attended: start (reserves the stock), fulfil (registers the outbound movement) or reject (with a
 * reason; releases the reservation). In memory: a reload starts over.
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
  lines: { productId: number; quantity: number; reserved: number }[];
  rejectionReason: string | null;
  movement: { id: number; number: string } | null;
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
    rejectionReason: row.rejectionReason,
    movement: row.movement,
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
        reservedQuantity: line.reserved,
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
        reserved: 0,
      })),
      rejectionReason: null,
      movement: null,
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
  'POST /stock-requests/:id/start': ({ params }) => {
    const found = forAttention(params.id);
    if (!found.ok) return found.response;
    const { row, org, userId } = found;
    const invalid = transition(row, 'IN_PROGRESS');
    if (invalid) return invalid;
    // The full quantity of every line, against what other requests in attention already hold.
    for (const [index, line] of row.lines.entries()) {
      const free =
        (stockByWarehouse(org, line.productId).get(row.warehouseId) ?? 0) -
        reservedOf(org, line.productId, row.warehouseId, row.id);
      if (free < line.quantity) {
        const sku = findProductRow(org, line.productId)?.sku ?? '';
        return error(
          409,
          'INSUFFICIENT_STOCK',
          `Line ${index + 1}: not enough available stock of ${sku} in the warehouse`,
        );
      }
    }
    row.lines.forEach((line) => {
      line.reserved = line.quantity;
      reserve(org, line.productId, row.warehouseId, row.id, line.quantity);
      evaluateAlert(org, line.productId, row.warehouseId);
    });
    setStatus(row, 'IN_PROGRESS', userId, null);
    return { status: 200, data: toDto(row) };
  },

  'POST /stock-requests/:id/fulfil': ({ params, body }) => {
    const found = forAttention(params.id);
    if (!found.ok) return found.response;
    const { row, org, userId } = found;
    const invalid = transition(row, 'FULFILLED');
    if (invalid) return invalid;
    const input = (body ?? {}) as { lines?: { lineNumber?: unknown; lotCode?: unknown }[] };
    const chosen = new Map<number, string | null>();
    for (const line of input.lines ?? []) {
      const n = Number(line.lineNumber);
      if (!Number.isInteger(n) || n < 1 || n > row.lines.length) {
        return error(
          400,
          'LINE_INVALID',
          `Line ${String(line.lineNumber)} is not a line of the request`,
        );
      }
      const lot =
        typeof line.lotCode === 'string' && line.lotCode.trim() ? line.lotCode.trim() : null;
      chosen.set(n, lot);
    }
    // Check every line before touching the stock: all or nothing.
    for (const [index, line] of row.lines.entries()) {
      const n = index + 1;
      const product = findProductRow(org, line.productId)!;
      const lot = chosen.get(n) ?? null;
      if (product.tracksLots && !lot) {
        return error(
          400,
          'LOT_REQUIRED',
          `Line ${n}: the product tracks lots; a lot code is required`,
        );
      }
      if (!product.tracksLots && lot) {
        return error(400, 'LOT_NOT_ALLOWED', `Line ${n}: the product does not track lots`);
      }
      if (lot && !lotExists(org, product.id, lot)) {
        return error(400, 'LOT_NOT_FOUND', `Line ${n}: the lot does not exist for this product`);
      }
      if (onHand(org, product.id, row.warehouseId, lot) < line.quantity) {
        return error(
          409,
          'INSUFFICIENT_STOCK',
          `Line ${n}: not enough stock of ${product.sku} at that location`,
        );
      }
    }
    release(row.id);
    const lots = row.lines.map((_, index) => chosen.get(index + 1) ?? null);
    row.lines.forEach((line, index) => {
      applyStock(
        org,
        line.productId,
        row.warehouseId,
        chosen.get(index + 1) ?? null,
        -line.quantity,
      );
      line.reserved = 0;
      evaluateAlert(org, line.productId, row.warehouseId);
    });
    // The "Consumption issue" movement, sourced from the request, in the movement history.
    const movement = recordMovement({
      org,
      source: 'STOCK_REQUEST',
      typeId: 3,
      warehouseId: row.warehouseId,
      userId,
      departmentId: row.departmentId,
      // As pango-core: the request's number is the movement's document.
      documentRef: `SR-${String(row.id).padStart(8, '0')}`,
      notes: null,
      lines: row.lines.map((line, index) => ({
        productId: line.productId,
        lot: lots[index],
        quantity: line.quantity,
        removes: true,
        unitCost: 0,
      })),
    });
    row.movement = { id: movement.id, number: movement.number };
    setStatus(row, 'FULFILLED', userId, null);
    return { status: 200, data: toDto(row) };
  },

  'POST /stock-requests/:id/reject': ({ params, body }) => {
    const found = forAttention(params.id);
    if (!found.ok) return found.response;
    const { row, org, userId } = found;
    const raw = (body as { reason?: unknown } | undefined)?.reason;
    const reason = typeof raw === 'string' ? raw.trim() : '';
    if (!reason) return error(400, 'VALIDATION', 'reason should not be empty');
    const invalid = transition(row, 'REJECTED');
    if (invalid) return invalid;
    release(row.id);
    row.lines.forEach((line) => {
      line.reserved = 0;
      evaluateAlert(org, line.productId, row.warehouseId);
    });
    row.rejectionReason = reason;
    setStatus(row, 'REJECTED', userId, reason);
    return { status: 200, data: toDto(row) };
  },
};

/** RF-REQ-003 / RN-016: the only transitions there are. */
const NEXT: Record<Status, Status[]> = {
  PENDING: ['IN_PROGRESS', 'REJECTED', 'CANCELLED'],
  IN_PROGRESS: ['FULFILLED', 'REJECTED'],
  FULFILLED: [],
  REJECTED: [],
  CANCELLED: [],
};

function transition(row: RequestRow, to: Status) {
  return NEXT[row.status].includes(to)
    ? null
    : error(409, 'STOCK_REQUEST_STATUS_INVALID', `A ${row.status} request cannot become ${to}`);
}

function setStatus(row: RequestRow, status: Status, userId: string, reason: string | null) {
  const now = new Date().toISOString();
  row.status = status;
  row.events.push({ status, userId, reason, createdAt: now });
  row.updatedAt = now;
}

function forAttention(
  id: string,
):
  | { ok: false; response: MockResponse }
  | { ok: true; row: RequestRow; org: string; userId: string } {
  const auth = authorize('stock_request.approve');
  if (auth.error) return { ok: false, response: auth.error };
  const org = auth.user.organization_id;
  const row = requests.find((r) => r.organizationId === org && r.id === Number(id));
  if (!row) {
    return {
      ok: false,
      response: error(404, 'STOCK_REQUEST_NOT_FOUND', 'Stock request not found'),
    };
  }
  // Separation of duties: whoever asked does not attend their own request. Not in pango-core
  // yet (requested); the code is the one proposed to the backend team.
  if (row.requestedById === auth.user.id) {
    return {
      ok: false,
      response: error(
        403,
        'REQUESTER_CANNOT_ATTEND',
        'The requester cannot attend their own stock request',
      ),
    };
  }
  return { ok: true, row, org, userId: auth.user.id };
}

import { areas, findUserById } from '../db';
import { authorize, error } from '../guard';
import { numericId } from '../ids';
import { applyStock, evaluateAlert, lotExists, onHand, trackTransferInTransit } from '../stock';
import type { MockRoutes } from '../server';
import { addEntryCost, averageCostOf, findProductRow, findUnitRow } from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * The movement endpoints of pango-core (`docs/movements.md`): movement types, registering a
 * movement (confirmed at once, it changes the shared stock in `../stock.ts`) and the history
 * (US-014), which also holds the outbound movements that fulfil stock requests, and transfers
 * between warehouses (CU-16: in transit until received, or received at once). Every role may
 * register every type here; the API narrows types per role and warehouse.
 */

type Nature = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';

/** As seeded by the backend's migrations, in the same order. */
const types: { id: number; name: string; nature: Nature; countsAsDemand: boolean }[] = [
  { id: 1, name: 'Opening balance', nature: 'INBOUND', countsAsDemand: false },
  { id: 2, name: 'Purchase receipt', nature: 'INBOUND', countsAsDemand: false },
  { id: 3, name: 'Consumption issue', nature: 'OUTBOUND', countsAsDemand: true },
  { id: 4, name: 'Transfer', nature: 'TRANSFER', countsAsDemand: false },
  { id: 5, name: 'Inventory adjustment', nature: 'ADJUSTMENT', countsAsDemand: false },
  // `sales_issue_movement_type` migration.
  { id: 6, name: 'Sales issue', nature: 'OUTBOUND', countsAsDemand: true },
];

let lastId = 0;

interface MovementLineRow {
  productId: number;
  lot: string | null;
  quantity: number;
  /** Stock left the warehouse (outbound, or an adjustment that decreases; a transfer's origin). */
  removes: boolean;
  unitCost: number;
  /** Transfers: what arrived; null while in transit. */
  receivedQuantity?: number | null;
}

/** An immutable movement of the history (RN-006): never edited nor deleted. */
interface MovementRow {
  id: number;
  number: string;
  org: string;
  source: 'MANUAL' | 'STOCK_REQUEST';
  typeId: number;
  /** On transfers, the origin. */
  warehouseId: number;
  status: 'CONFIRMED' | 'IN_TRANSIT';
  /** Transfers: where the stock goes. */
  destinationWarehouseId: number | null;
  receivedById: string | null;
  receivedAt: string | null;
  userId: string;
  /** The requesting area, on movements that fulfil a stock request. */
  departmentId: string | null;
  documentRef: string | null;
  notes: string | null;
  occurredAt: string;
  lines: MovementLineRow[];
}

const movements: MovementRow[] = [];

/** For the dashboard mock: the organization's movements and the nature of their type. */
export const movementsOf = (org: string) => movements.filter((m) => m.org === org);
export const movementTypeOf = (typeId: number) => types.find((t) => t.id === typeId);

/** Adds a confirmed movement to the history, with the next number (`MV-00000012`). */
export function recordMovement(
  input: Omit<
    MovementRow,
    | 'id'
    | 'number'
    | 'occurredAt'
    | 'status'
    | 'destinationWarehouseId'
    | 'receivedById'
    | 'receivedAt'
  > &
    Partial<
      Pick<MovementRow, 'status' | 'destinationWarehouseId' | 'receivedById' | 'receivedAt'>
    > & {
      occurredAt?: string;
    },
): MovementRow {
  lastId += 1;
  const row: MovementRow = {
    status: 'CONFIRMED',
    destinationWarehouseId: null,
    receivedById: null,
    receivedAt: null,
    ...input,
    id: lastId,
    number: `MV-${String(lastId).padStart(8, '0')}`,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
  movements.push(row);
  return row;
}

function toDto(row: MovementRow) {
  const type = types.find((t) => t.id === row.typeId)!;
  const warehouse = findWarehouseRow(row.org, row.warehouseId)!;
  const location = { id: warehouse.defaultLocationId, code: 'DEFAULT' };
  const destination =
    row.destinationWarehouseId === null
      ? null
      : findWarehouseRow(row.org, row.destinationWarehouseId)!;
  const user = (id: string) => ({ id: numericId(id), name: findUserById(id)?.full_name ?? null });
  const area = row.departmentId ? areas.find((a) => a.id === row.departmentId) : undefined;
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    source: row.source,
    movementType: {
      id: type.id,
      name: type.name,
      nature: type.nature,
      countsAsDemand: type.countsAsDemand,
    },
    warehouse: { id: warehouse.id, name: warehouse.name },
    destinationWarehouse: destination ? { id: destination.id, name: destination.name } : null,
    registeredBy: user(row.userId),
    receivedBy: row.receivedById ? user(row.receivedById) : null,
    receivedAt: row.receivedAt,
    department: area ? { id: numericId(area.id), name: area.name } : null,
    documentRef: row.documentRef,
    notes: row.notes,
    occurredAt: row.occurredAt,
    lines: row.lines.map((line, index) => {
      const product = findProductRow(row.org, line.productId)!;
      return {
        lineNumber: index + 1,
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          unit: findUnitRow(product.stockUnitId)?.code ?? '',
        },
        originLocation: line.removes ? location : null,
        destinationLocation: destination
          ? { id: destination.defaultLocationId, code: 'DEFAULT' }
          : line.removes
            ? null
            : location,
        lot: line.lot ? { id: index + 1, code: line.lot } : null,
        quantity: line.quantity,
        receivedQuantity: line.receivedQuantity ?? null,
        unitCost: line.unitCost,
      };
    }),
  };
}

/** An inclusive ISO 8601 bound, or `undefined` if absent; `null` if it does not parse. */
function instant(value: string | undefined): number | null | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

interface LineInput {
  productId?: unknown;
  quantity?: unknown;
  lotCode?: unknown;
  unitCost?: unknown;
  direction?: unknown;
}

const decimals = (value: number) => (String(value).split('.')[1] ?? '').length;

export const movementsRoutes: MockRoutes = {
  'GET /movement-types': () => {
    const auth = authorize('movement.read', 'movement.create');
    if (auth.error) return auth.error;
    const data = [...types]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((type) => ({ ...type, isBase: true }));
    return { status: 200, data };
  },

  'GET /movements': ({ query }) => {
    const auth = authorize('movement.read');
    if (auth.error) return auth.error;
    const from = instant(query.from);
    const to = instant(query.to);
    if (from === null || to === null) {
      return error(400, 'VALIDATION', 'from and to must be valid ISO 8601 date strings');
    }
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25)));
    const list = movements
      .filter((row) => row.org === auth.user.organization_id)
      .filter(
        (row) =>
          !query.warehouseId ||
          row.warehouseId === Number(query.warehouseId) ||
          row.destinationWarehouseId === Number(query.warehouseId),
      )
      .filter(
        (row) =>
          !query.destinationWarehouseId ||
          row.destinationWarehouseId === Number(query.destinationWarehouseId) ||
          (row.destinationWarehouseId === null &&
            row.warehouseId === Number(query.destinationWarehouseId) &&
            row.lines.some((line) => !line.removes)),
      )
      .filter((row) => !query.status || row.status === query.status)
      .filter(
        (row) =>
          !query.productId || row.lines.some((line) => line.productId === Number(query.productId)),
      )
      .filter((row) => !query.movementTypeId || row.typeId === Number(query.movementTypeId))
      .filter(
        (row) => !query.nature || types.find((t) => t.id === row.typeId)?.nature === query.nature,
      )
      .filter((row) => from === undefined || Date.parse(row.occurredAt) >= from)
      .filter((row) => to === undefined || Date.parse(row.occurredAt) <= to)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id - a.id);
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

  'GET /movements/:id': ({ params }) => {
    const auth = authorize('movement.read');
    if (auth.error) return auth.error;
    const row = movements.find(
      (m) => m.org === auth.user.organization_id && m.id === Number(params.id),
    );
    if (!row) return error(404, 'MOVEMENT_NOT_FOUND', 'Movement not found');
    return { status: 200, data: toDto(row) };
  },

  'POST /movements': ({ body }) => {
    const auth = authorize('movement.create');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const input = (body ?? {}) as {
      movementTypeId?: unknown;
      warehouseId?: unknown;
      destinationWarehouseId?: unknown;
      receiveNow?: unknown;
      documentRef?: unknown;
      notes?: unknown;
      lines?: LineInput[];
    };

    const lines = Array.isArray(input.lines) ? input.lines : [];
    const problems: string[] = [];
    if (!Number.isInteger(input.movementTypeId))
      problems.push('movementTypeId must be an integer number');
    if (!Number.isInteger(input.warehouseId))
      problems.push('warehouseId must be an integer number');
    if (lines.length < 1 || lines.length > 200)
      problems.push('lines must contain between 1 and 200 elements');
    if (typeof input.documentRef === 'string' && input.documentRef.trim().length > 40) {
      problems.push('documentRef must be shorter than or equal to 40 characters');
    }
    if (typeof input.notes === 'string' && input.notes.trim().length > 2000) {
      problems.push('notes must be shorter than or equal to 2000 characters');
    }
    lines.forEach((line, index) => {
      const q = line.quantity;
      if (typeof q !== 'number' || q < 0.0001 || decimals(q) > 4) {
        problems.push(`lines.${index}.quantity must not be less than 0.0001`);
      }
      if (
        line.direction !== undefined &&
        line.direction !== 'INCREASE' &&
        line.direction !== 'DECREASE'
      ) {
        problems.push(
          `lines.${index}.direction must be one of the following values: INCREASE, DECREASE`,
        );
      }
      if (typeof line.lotCode === 'string' && line.lotCode.trim().length > 40) {
        problems.push(`lines.${index}.lotCode must be shorter than or equal to 40 characters`);
      }
    });
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));

    const type = types.find((t) => t.id === input.movementTypeId);
    if (!type) return error(400, 'MOVEMENT_TYPE_INVALID', 'The movement type does not exist');
    const transfer = type.nature === 'TRANSFER';
    if (
      !transfer &&
      (input.destinationWarehouseId !== undefined || input.receiveNow !== undefined)
    ) {
      return error(
        400,
        'TRANSFER_FIELDS_NOT_ALLOWED',
        'Only transfers take a destination warehouse, destination locations or receiveNow',
      );
    }
    const warehouse = findWarehouseRow(org, input.warehouseId as number);
    if (!warehouse?.isActive) {
      return error(400, 'WAREHOUSE_INVALID', 'The warehouse does not exist or is inactive');
    }
    let destination: ReturnType<typeof findWarehouseRow> = undefined;
    if (transfer) {
      if (input.destinationWarehouseId === undefined) {
        return error(
          400,
          'DESTINATION_WAREHOUSE_REQUIRED',
          'Transfers need a destination warehouse',
        );
      }
      if (input.destinationWarehouseId === warehouse.id) {
        return error(400, 'SAME_WAREHOUSE', 'A transfer needs a destination other than its origin');
      }
      destination = findWarehouseRow(org, Number(input.destinationWarehouseId));
      if (!destination?.isActive) {
        return error(
          400,
          'DESTINATION_WAREHOUSE_INVALID',
          'The destination warehouse does not exist or is inactive',
        );
      }
    }
    const receiveNow = transfer && input.receiveNow === true;

    // Check every line before touching the stock: the movement is all or nothing.
    const plan: { productId: number; lot: string | null; delta: number }[] = [];
    for (const [index, line] of lines.entries()) {
      const n = index + 1;
      const product = findProductRow(org, Number(line.productId));
      if (!product?.isActive) {
        return error(
          400,
          'PRODUCT_INVALID',
          `Line ${n}: the product does not exist or is inactive`,
        );
      }
      const lot =
        typeof line.lotCode === 'string' && line.lotCode.trim() ? line.lotCode.trim() : null;
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
      const isAdjustment = type.nature === 'ADJUSTMENT';
      if (isAdjustment !== (line.direction !== undefined)) {
        return error(
          400,
          'LINE_DIRECTION_INVALID',
          `Line ${n}: only adjustment lines take a direction`,
        );
      }
      const removes = transfer || type.nature === 'OUTBOUND' || line.direction === 'DECREASE';
      const quantity = line.quantity as number;
      if (removes) {
        if (lot && !lotExists(org, product.id, lot)) {
          return error(400, 'LOT_NOT_FOUND', `Line ${n}: the lot does not exist for this product`);
        }
        const planned = plan
          .filter((p) => p.productId === product.id && p.lot === lot)
          .reduce((sum, p) => sum + p.delta, 0);
        if (onHand(org, product.id, warehouse.id, lot) + planned < quantity) {
          return error(
            409,
            'INSUFFICIENT_STOCK',
            `Line ${n}: not enough stock of ${product.sku} at that location`,
          );
        }
      }
      plan.push({ productId: product.id, lot, delta: removes ? -quantity : quantity });
    }

    // Each line moves at a cost: what an entry declares, otherwise the current average. A
    // declared cost moves the average before the stock arrives (pango-core's order).
    const costs = plan.map((p, index) => {
      const given = lines[index].unitCost;
      const declared = p.delta > 0 && !transfer && typeof given === 'number' ? given : null;
      const cost = declared ?? averageCostOf(org, p.productId);
      if (declared !== null) addEntryCost(org, p.productId, p.delta, declared);
      return cost;
    });
    plan.forEach((p) => applyStock(org, p.productId, warehouse.id, p.lot, p.delta));
    // Each movement re-evaluates the alerts of its products in the warehouse (CU-12a).
    new Set(plan.map((p) => p.productId)).forEach((id) => evaluateAlert(org, id, warehouse.id));
    if (destination && receiveNow) {
      plan.forEach((p) => applyStock(org, p.productId, destination.id, p.lot, -p.delta));
      new Set(plan.map((p) => p.productId)).forEach((id) => evaluateAlert(org, id, destination.id));
    } else if (destination) {
      trackTransferInTransit(org, [warehouse.id, destination.id], 1);
    }
    const now = new Date().toISOString();
    const row = recordMovement({
      org,
      source: 'MANUAL',
      typeId: type.id,
      warehouseId: warehouse.id,
      status: destination && !receiveNow ? 'IN_TRANSIT' : 'CONFIRMED',
      destinationWarehouseId: destination?.id ?? null,
      receivedById: receiveNow ? auth.user.id : null,
      receivedAt: receiveNow ? now : null,
      userId: auth.user.id,
      departmentId: null,
      documentRef: typeof input.documentRef === 'string' ? input.documentRef.trim() || null : null,
      notes: typeof input.notes === 'string' ? input.notes.trim() || null : null,
      lines: plan.map((p, index) => ({
        productId: p.productId,
        lot: p.lot,
        quantity: Math.abs(p.delta),
        removes: p.delta < 0,
        unitCost: costs[index],
        receivedQuantity: receiveNow ? Math.abs(p.delta) : null,
      })),
    });
    return { status: 201, data: toDto(row) };
  },

  // CU-16: what arrived is added to the destination; what is short is lost on the way.
  'POST /movements/:id/receive': ({ params, body }) => {
    const auth = authorize('movement.receive');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const row = movements.find((m) => m.org === org && m.id === Number(params.id));
    if (!row) return error(404, 'MOVEMENT_NOT_FOUND', 'Movement not found');
    if (row.status !== 'IN_TRANSIT' || row.destinationWarehouseId === null) {
      return error(409, 'MOVEMENT_NOT_IN_TRANSIT', 'Only transfers in transit can be received');
    }
    const destination = findWarehouseRow(org, row.destinationWarehouseId);
    if (!destination?.isActive) {
      return error(
        400,
        'DESTINATION_WAREHOUSE_INVALID',
        'The destination warehouse does not exist or is inactive',
      );
    }
    const input = (body ?? {}) as {
      lines?: { lineNumber?: unknown; receivedQuantity?: unknown }[];
    };
    const changes = new Map<number, number>();
    for (const line of input.lines ?? []) {
      const n = Number(line.lineNumber);
      const sent = row.lines[n - 1];
      if (!sent || changes.has(n)) {
        return error(
          400,
          'RECEIPT_LINE_INVALID',
          `Line ${n} is not a line of the transfer, or it is repeated`,
        );
      }
      const q = line.receivedQuantity;
      if (typeof q !== 'number' || q < 0 || decimals(q) > 4) {
        return error(400, 'VALIDATION', 'receivedQuantity must not be less than 0');
      }
      if (q > sent.quantity) {
        return error(
          400,
          'RECEIVED_QUANTITY_INVALID',
          `Line ${n}: the received quantity cannot exceed the quantity sent`,
        );
      }
      changes.set(n, q);
    }
    row.lines.forEach((line, index) => {
      const received = changes.get(index + 1) ?? line.quantity;
      line.receivedQuantity = received;
      if (received > 0) applyStock(org, line.productId, destination.id, line.lot, received);
    });
    new Set(row.lines.map((line) => line.productId)).forEach((id) =>
      evaluateAlert(org, id, destination.id),
    );
    trackTransferInTransit(org, [row.warehouseId, destination.id], -1);
    row.status = 'CONFIRMED';
    row.receivedById = auth.user.id;
    row.receivedAt = new Date().toISOString();
    return { status: 200, data: toDto(row) };
  },
};

// Seed: the history behind the seeded stock (`../stock.ts`), so on hand is inbound minus outbound:
// Tornillo M8 1 000 + 400 − 200 = 1 200 (lot L-2026-10); Caja corrugada 150 − 40 − 25 = 85.
const daysAgo = (days: number, hour: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 11) +
  `${String(hour).padStart(2, '0')}:20:00.000Z`;
const seedLine = (
  productId: number,
  quantity: number,
  removes: boolean,
  lot: string | null = null,
) => ({
  productId,
  lot,
  quantity,
  removes,
  unitCost: 0,
});
const seed = {
  org: 'org-pango',
  warehouseId: 1,
  departmentId: null,
  documentRef: null,
  notes: null,
  source: 'MANUAL' as const,
};
recordMovement({
  ...seed,
  typeId: 1,
  userId: 'usr-001',
  occurredAt: daysAgo(20, 13),
  lines: [seedLine(1, 1000, false, 'L-2026-10'), seedLine(3, 150, false)],
});
recordMovement({
  ...seed,
  typeId: 2,
  userId: 'usr-002',
  documentRef: 'FAC-1043',
  occurredAt: daysAgo(12, 15),
  lines: [seedLine(1, 400, false, 'L-2026-10')],
});
recordMovement({
  ...seed,
  typeId: 3,
  userId: 'usr-002',
  source: 'STOCK_REQUEST',
  departmentId: 'area-admin',
  occurredAt: daysAgo(10, 16),
  lines: [seedLine(3, 40, true)],
});
recordMovement({
  ...seed,
  typeId: 3,
  userId: 'usr-002',
  notes: 'Mantenimiento de la línea 2',
  occurredAt: daysAgo(5, 14),
  lines: [seedLine(1, 200, true, 'L-2026-10')],
});
recordMovement({
  ...seed,
  typeId: 3,
  userId: 'usr-001',
  occurredAt: daysAgo(4, 18),
  lines: [seedLine(3, 25, true)],
});

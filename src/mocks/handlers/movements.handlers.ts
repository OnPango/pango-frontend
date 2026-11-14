import { areas, findUserById } from '../db';
import { authorize, error } from '../guard';
import { numericId } from '../ids';
import { applyStock, evaluateAlert, lotExists, onHand } from '../stock';
import type { MockRoutes } from '../server';
import { findProductRow, findUnitRow } from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * The movement endpoints of pango-core (`docs/movements.md`): movement types, registering a
 * movement (confirmed at once, it changes the shared stock in `../stock.ts`) and the history
 * (US-014), which also holds the outbound movements that fulfil stock requests. Every role may
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
];

let lastId = 0;

interface MovementLineRow {
  productId: number;
  lot: string | null;
  quantity: number;
  /** Stock left the warehouse (outbound, or an adjustment that decreases). */
  removes: boolean;
  unitCost: number;
}

/** An immutable movement of the history (RN-006): never edited nor deleted. */
interface MovementRow {
  id: number;
  number: string;
  org: string;
  source: 'MANUAL' | 'STOCK_REQUEST';
  typeId: number;
  warehouseId: number;
  userId: string;
  /** The requesting area, on movements that fulfil a stock request. */
  departmentId: string | null;
  documentRef: string | null;
  notes: string | null;
  occurredAt: string;
  lines: MovementLineRow[];
}

const movements: MovementRow[] = [];

/** Adds a confirmed movement to the history, with the next number (`MV-00000012`). */
export function recordMovement(
  input: Omit<MovementRow, 'id' | 'number' | 'occurredAt'> & { occurredAt?: string },
): MovementRow {
  lastId += 1;
  const row: MovementRow = {
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
  const area = row.departmentId ? areas.find((a) => a.id === row.departmentId) : undefined;
  return {
    id: row.id,
    number: row.number,
    status: 'CONFIRMED',
    source: row.source,
    movementType: {
      id: type.id,
      name: type.name,
      nature: type.nature,
      countsAsDemand: type.countsAsDemand,
    },
    warehouse: { id: warehouse.id, name: warehouse.name },
    registeredBy: { id: numericId(row.userId), name: findUserById(row.userId)?.full_name ?? null },
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
        destinationLocation: line.removes ? null : location,
        lot: line.lot ? { id: index + 1, code: line.lot } : null,
        quantity: line.quantity,
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
      .filter((row) => !query.warehouseId || row.warehouseId === Number(query.warehouseId))
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
    lines.forEach((line, index) => {
      const q = line.quantity;
      if (typeof q !== 'number' || q < 0.0001 || decimals(q) > 4) {
        problems.push(`lines.${index}.quantity must not be less than 0.0001`);
      }
      if (typeof line.lotCode === 'string' && line.lotCode.trim().length > 40) {
        problems.push(`lines.${index}.lotCode must be shorter than or equal to 40 characters`);
      }
    });
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));

    const type = types.find((t) => t.id === input.movementTypeId);
    if (!type) return error(400, 'MOVEMENT_TYPE_INVALID', 'The movement type does not exist');
    if (type.nature === 'TRANSFER') {
      return error(400, 'MOVEMENT_TYPE_NOT_SUPPORTED', 'Transfers cannot be registered yet');
    }
    const warehouse = findWarehouseRow(org, input.warehouseId as number);
    if (!warehouse?.isActive) {
      return error(400, 'WAREHOUSE_INVALID', 'The warehouse does not exist or is inactive');
    }

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
      const removes = type.nature === 'OUTBOUND' || line.direction === 'DECREASE';
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

    plan.forEach((p) => applyStock(org, p.productId, warehouse.id, p.lot, p.delta));
    // Each movement re-evaluates the alerts of its products in the warehouse (CU-12a).
    new Set(plan.map((p) => p.productId)).forEach((id) => evaluateAlert(org, id, warehouse.id));
    const row = recordMovement({
      org,
      source: 'MANUAL',
      typeId: type.id,
      warehouseId: warehouse.id,
      userId: auth.user.id,
      departmentId: null,
      documentRef: typeof input.documentRef === 'string' ? input.documentRef.trim() || null : null,
      notes: typeof input.notes === 'string' ? input.notes.trim() || null : null,
      lines: plan.map((p, index) => ({
        productId: p.productId,
        lot: p.lot,
        quantity: Math.abs(p.delta),
        removes: p.delta < 0,
        unitCost: typeof lines[index].unitCost === 'number' ? (lines[index].unitCost as number) : 0,
      })),
    });
    return { status: 201, data: toDto(row) };
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

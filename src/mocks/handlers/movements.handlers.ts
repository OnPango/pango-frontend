import { authorize, error } from '../guard';
import { applyStock, evaluateAlert, lotExists, onHand } from '../stock';
import type { MockRoutes } from '../server';
import { findProductRow, findUnitRow } from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * The movement endpoints of pango-core (`docs/movements.md`): movement types and registering a
 * movement, which is confirmed at once and changes the shared stock (`../stock.ts`). Every role
 * may register every type here; the API narrows types per role and warehouse.
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

/** The next movement number, also for the outbound movement that fulfils a stock request. */
export function nextMovement() {
  lastId += 1;
  return { id: lastId, number: `MV-${String(lastId).padStart(8, '0')}` };
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
    const { id, number } = nextMovement();
    const location = { id: warehouse.defaultLocationId, code: 'DEFAULT' };
    return {
      status: 201,
      data: {
        id,
        number,
        status: 'CONFIRMED',
        source: 'MANUAL',
        movementType: {
          id: type.id,
          name: type.name,
          nature: type.nature,
          countsAsDemand: type.countsAsDemand,
        },
        warehouse: { id: warehouse.id, name: warehouse.name },
        registeredBy: { id: 1, name: auth.user.full_name },
        department: null,
        documentRef:
          typeof input.documentRef === 'string' ? input.documentRef.trim() || null : null,
        notes: typeof input.notes === 'string' ? input.notes.trim() || null : null,
        occurredAt: new Date().toISOString(),
        lines: lines.map((line, index) => {
          const product = findProductRow(org, Number(line.productId))!;
          const removes = plan[index].delta < 0;
          return {
            lineNumber: index + 1,
            product: {
              id: product.id,
              sku: product.sku,
              name: product.name,
              unit: findUnitRow(product.stockUnitId)?.code ?? '',
            },
            originLocation: removes ? location : null,
            destinationLocation: removes ? null : location,
            lot: plan[index].lot ? { id: index + 1, code: plan[index].lot } : null,
            quantity: line.quantity,
            unitCost: typeof line.unitCost === 'number' ? line.unitCost : 0,
          };
        }),
      },
    };
  },
};

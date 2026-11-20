import { authorize, error } from '../guard';
import { warehouseHasStock } from '../stock';
import type { MockRoutes } from '../server';

/**
 * The warehouse endpoints of pango-core (`docs/warehouses.md`). Kept in memory (a reload starts
 * over) and per organization; the seed organization starts with two open warehouses and a closed
 * one. The mock does not narrow the list per role assignment: everyone sees every warehouse.
 */

type WarehouseType = 'WAREHOUSE' | 'STORE';

interface WarehouseRow {
  id: number;
  organizationId: string;
  code: string;
  name: string;
  type: WarehouseType;
  address: string | null;
  defaultLocationId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SEED_ORG = 'org-pango';
const SEED_DATE = '2026-09-20T08:00:00Z';

const seed = (
  id: number,
  code: string,
  name: string,
  type: WarehouseType,
  address: string | null,
  isActive = true,
): WarehouseRow => ({
  id,
  organizationId: SEED_ORG,
  code,
  name,
  type,
  address,
  defaultLocationId: 100 + id,
  isActive,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
});

const warehouses: WarehouseRow[] = [
  seed(1, 'BOD-CENTRAL', 'Bodega Central', 'WAREHOUSE', 'Calle 80 # 45-12, Barranquilla'),
  seed(2, 'TDA-NORTE', 'Tienda Norte', 'STORE', 'Cra 51B # 94-30, Barranquilla'),
  seed(3, 'BOD-DESPACHO', 'Despacho', 'WAREHOUSE', null, false),
];

const toDto = (row: WarehouseRow) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  type: row.type,
  address: row.address,
  defaultLocation: { id: row.defaultLocationId, code: 'DEFAULT' },
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/** For other mocks: the active warehouses of the organization. */
export const activeWarehousesOf = (organizationId: string) =>
  warehouses.filter((row) => row.organizationId === organizationId && row.isActive);

/** For other mocks: a warehouse of the organization by its numeric id. */
export const findWarehouseRow = (organizationId: string, id: number) =>
  warehouses.find((row) => row.organizationId === organizationId && row.id === id);

const find = (organizationId: string, id: string) =>
  warehouses.find((row) => row.organizationId === organizationId && row.id === Number(id));

/** Code and name are unique in the organization, ignoring case. */
function taken(organizationId: string, field: 'code' | 'name', value: string, exceptId?: number) {
  return warehouses.some(
    (row) =>
      row.organizationId === organizationId &&
      row.id !== exceptId &&
      row[field].toLowerCase() === value.toLowerCase(),
  );
}

/** The checks class-validator makes on `CreateWarehouseDto`, with its message style. */
function validate(body: Record<string, unknown>, partial: boolean): string[] {
  const problems: string[] = [];
  const text = (field: string, max: number) => {
    const value = body[field];
    if (partial && value === undefined) return;
    if (typeof value !== 'string' || value.trim() === '')
      problems.push(`${field} should not be empty`);
    else if (value.trim().length > max)
      problems.push(`${field} must be shorter than or equal to ${max} characters`);
  };
  text('code', 20);
  text('name', 80);
  if (!(partial && body.type === undefined) && body.type !== 'WAREHOUSE' && body.type !== 'STORE') {
    problems.push('type must be one of the following values: WAREHOUSE, STORE');
  }
  const address = body.address;
  if (address !== undefined && address !== null) {
    if (typeof address !== 'string') problems.push('address must be a string');
    else if (address.trim().length > 200)
      problems.push('address must be shorter than or equal to 200 characters');
  }
  return problems;
}

export const warehousesRoutes: MockRoutes = {
  'GET /warehouses': ({ query }) => {
    const auth = authorize('warehouse.read', 'warehouse.manage', 'user.manage');
    if (auth.error) return auth.error;
    const status = query.status ?? 'ACTIVE';
    const search = (query.search ?? '').trim().toLowerCase();
    const list = warehouses
      .filter((row) => row.organizationId === auth.user.organization_id)
      .filter((row) => status === 'ALL' || (status === 'ACTIVE') === row.isActive)
      .filter((row) => !query.type || row.type === query.type)
      .filter(
        (row) =>
          !search ||
          row.code.toLowerCase().includes(search) ||
          row.name.toLowerCase().includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { status: 200, data: list.map(toDto) };
  },

  'GET /warehouses/:id': ({ params }) => {
    const auth = authorize('warehouse.read', 'warehouse.manage');
    if (auth.error) return auth.error;
    const row = find(auth.user.organization_id, params.id);
    if (!row) return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    return { status: 200, data: toDto(row) };
  },

  'POST /warehouses': ({ body }) => {
    const auth = authorize('warehouse.manage');
    if (auth.error) return auth.error;
    const input = (body ?? {}) as Record<string, unknown>;
    const problems = validate(input, false);
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));
    const organizationId = auth.user.organization_id;
    const code = (input.code as string).trim();
    const name = (input.name as string).trim();
    if (taken(organizationId, 'code', code)) {
      return error(409, 'WAREHOUSE_CODE_TAKEN', 'A warehouse with this code already exists');
    }
    if (taken(organizationId, 'name', name)) {
      return error(409, 'WAREHOUSE_NAME_TAKEN', 'A warehouse with this name already exists');
    }
    const now = new Date().toISOString();
    const id = warehouses.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    const row: WarehouseRow = {
      id,
      organizationId,
      code,
      name,
      type: input.type as WarehouseType,
      address: typeof input.address === 'string' ? input.address.trim() || null : null,
      defaultLocationId: 100 + id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    warehouses.push(row);
    return { status: 201, data: toDto(row) };
  },

  'PATCH /warehouses/:id': ({ params, body }) => {
    const auth = authorize('warehouse.manage');
    if (auth.error) return auth.error;
    const organizationId = auth.user.organization_id;
    const row = find(organizationId, params.id);
    if (!row) return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    const input = (body ?? {}) as Record<string, unknown>;
    const problems = validate(input, true);
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));

    const code = typeof input.code === 'string' ? input.code.trim() : undefined;
    const name = typeof input.name === 'string' ? input.name.trim() : undefined;
    if (code !== undefined && taken(organizationId, 'code', code, row.id)) {
      return error(409, 'WAREHOUSE_CODE_TAKEN', 'A warehouse with this code already exists');
    }
    if (name !== undefined && taken(organizationId, 'name', name, row.id)) {
      return error(409, 'WAREHOUSE_NAME_TAKEN', 'A warehouse with this name already exists');
    }
    if (input.isActive === false && row.isActive && warehouseHasStock(organizationId, row.id)) {
      return error(409, 'WAREHOUSE_HAS_STOCK', 'The warehouse still has stock on hand');
    }

    if (code !== undefined) row.code = code;
    if (name !== undefined) row.name = name;
    if (input.type !== undefined) row.type = input.type as WarehouseType;
    if (input.address !== undefined) {
      row.address = typeof input.address === 'string' ? input.address.trim() || null : null;
    }
    if (typeof input.isActive === 'boolean') row.isActive = input.isActive;
    row.updatedAt = new Date().toISOString();
    return { status: 200, data: toDto(row) };
  },
};

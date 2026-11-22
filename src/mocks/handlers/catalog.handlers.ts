import { authorize, error } from '../guard';
import { enabledWarehouses, hasMovements, replenishmentOf, stockByWarehouse } from '../stock';
import { findWarehouseRow } from './warehouses.handlers';
import type { MockRoutes } from '../server';

/**
 * The catalog endpoints of pango-core (`docs/catalog.md`): products, families (categories) and
 * units of measure. Kept in memory (a reload starts over) and per organization; the seed
 * organization starts with a few families and products.
 */

interface UnitRow {
  id: number;
  code: string;
  name: string;
}

interface CategoryRow {
  id: number;
  organizationId: string;
  name: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductRow {
  id: number;
  organizationId: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: number;
  stockUnitId: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  volumeL: number | null;
  tracksLots: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const units: UnitRow[] = [
  { id: 1, code: 'EA', name: 'Each' },
  { id: 2, code: 'KGM', name: 'Kilogram' },
  { id: 3, code: 'GRM', name: 'Gram' },
  { id: 4, code: 'LTR', name: 'Litre' },
  { id: 5, code: 'MLT', name: 'Millilitre' },
  { id: 6, code: 'MTR', name: 'Metre' },
  { id: 7, code: 'BX', name: 'Box' },
  { id: 8, code: 'PK', name: 'Pack' },
];

const SEED_ORG = 'org-pango';
const SEED_DATE = '2026-10-01T08:00:00Z';

const category = (id: number, name: string, parentId: number | null = null): CategoryRow => ({
  id,
  organizationId: SEED_ORG,
  name,
  description: null,
  parentId,
  isActive: true,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
});

const categories: CategoryRow[] = [
  category(1, 'Ferretería'),
  category(2, 'Tornillería', 1),
  category(3, 'Empaque'),
  category(4, 'Eléctrico'),
  category(5, 'Seguridad'),
];

const product = (
  id: number,
  sku: string,
  name: string,
  categoryId: number,
  extra: Partial<ProductRow> = {},
): ProductRow => ({
  id,
  organizationId: SEED_ORG,
  sku,
  name,
  description: null,
  categoryId,
  stockUnitId: 1,
  lengthCm: null,
  widthCm: null,
  heightCm: null,
  weightKg: null,
  volumeL: null,
  tracksLots: false,
  isActive: true,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
  ...extra,
});

const products: ProductRow[] = [
  product(1, 'PRD-001', 'Tornillo M8', 2, { tracksLots: true, weightKg: 0.012 }),
  product(2, 'PRD-002', 'Tuerca M8', 2, { tracksLots: true, weightKg: 0.006 }),
  product(3, 'PRD-051', 'Caja corrugada 40x30', 3, { lengthCm: 40, widthCm: 30, heightCm: 25 }),
  product(4, 'PRD-032', 'Cable USB', 4, { lengthCm: 100 }),
  product(5, 'PRD-017', 'Guantes talla M', 5, { stockUnitId: 8, tracksLots: true }),
  product(6, 'PRD-044', 'Etiquetas térmicas', 3, { stockUnitId: 8 }),
  product(7, 'PRD-009', 'Cinta de embalaje', 3, { lengthCm: 5000, widthCm: 4.8 }),
  product(8, 'PRD-088', 'Taladro percutor 13 mm', 4, { weightKg: 2.1, volumeL: 4.5 }),
  product(9, 'PRD-090', 'Pintura antigua', 1, { stockUnitId: 4, isActive: false }),
];

const nextId = (rows: { id: number }[]) => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

const findUnit = (id: number) => units.find((unit) => unit.id === id);

const findCategory = (organizationId: string, id: number) =>
  categories.find((row) => row.organizationId === organizationId && row.id === id);

/** A sibling (same parent) already has the name, ignoring case. */
const nameTaken = (
  organizationId: string,
  name: string,
  parentId: number | null,
  exceptId?: number,
) =>
  categories.some(
    (row) =>
      row.organizationId === organizationId &&
      row.id !== exceptId &&
      row.parentId === parentId &&
      row.name.toLowerCase() === name.toLowerCase(),
  );

/** The family and every subfamily below it. */
export function withDescendants(organizationId: string, id: number): Set<number> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const row of categories) {
      if (row.organizationId === organizationId && row.parentId !== null) {
        if (ids.has(row.parentId) && !ids.has(row.id)) {
          ids.add(row.id);
          grew = true;
        }
      }
    }
  }
  return ids;
}

const toCategoryDto = (row: CategoryRow) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  parentId: row.parentId,
  isActive: row.isActive,
  productCount: products.filter(
    (p) => p.organizationId === row.organizationId && p.categoryId === row.id,
  ).length,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

function toProductDto(row: ProductRow) {
  const family = findCategory(row.organizationId, row.categoryId);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: { id: row.categoryId, name: family?.name ?? '' },
    stockUnit: findUnit(row.stockUnitId),
    lengthCm: row.lengthCm,
    widthCm: row.widthCm,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    volumeL: row.volumeL,
    tracksLots: row.tracksLots,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** For the movement mock: a product of the organization by its numeric id. */
export const findProductRow = (organizationId: string, id: number) =>
  products.find((row) => row.organizationId === organizationId && row.id === id);

export const findUnitRow = (id: number) => units.find((unit) => unit.id === id);

export const findCategoryRow = (organizationId: string, id: number) =>
  categories.find((row) => row.organizationId === organizationId && row.id === id);

/** Every family of the organization, for the search mock. */
export const categoriesOf = (organizationId: string) =>
  categories.filter((row) => row.organizationId === organizationId);

/** Every product of the organization, for the stock mock. */
export const productsOf = (organizationId: string) =>
  products.filter((row) => row.organizationId === organizationId);

const findProduct = (organizationId: string, id: string) =>
  products.find((row) => row.organizationId === organizationId && row.id === Number(id));

function toProductDetailDto(row: ProductRow) {
  const org = row.organizationId;
  const stock = stockByWarehouse(org, row.id);
  const warehouses = enabledWarehouses(org, row.id).map((id) => {
    const { safetyStock, reorderPoint, valueSource } = replenishmentOf(org, row.id, id);
    return {
      warehouse: { id, name: findWarehouseRow(org, id)?.name ?? '' },
      onHand: stock.get(id) ?? 0,
      safetyStock,
      reorderPoint,
      valueSource,
    };
  });
  return {
    ...toProductDto(row),
    totalOnHand: Number(warehouses.reduce((sum, w) => sum + w.onHand, 0).toFixed(4)),
    warehouses,
    hasMovements: hasMovements(row.organizationId, row.id),
  };
}

const MEASURES = ['lengthCm', 'widthCm', 'heightCm', 'weightKg', 'volumeL'] as const;

/** The checks class-validator makes on `CreateProductDto`, with its message style. */
function validateProduct(body: Record<string, unknown>, partial = false): string[] {
  const problems: string[] = [];
  const text = (field: string, max: number) => {
    const value = body[field];
    if (partial && value === undefined) return;
    if (typeof value !== 'string' || value.trim() === '')
      problems.push(`${field} should not be empty`);
    else if (value.trim().length > max)
      problems.push(`${field} must be shorter than or equal to ${max} characters`);
  };
  text('sku', 40);
  text('name', 150);
  for (const field of ['categoryId', 'stockUnitId']) {
    if (partial && body[field] === undefined) continue;
    if (!Number.isInteger(body[field]) || (body[field] as number) < 1) {
      problems.push(`${field} must be an integer number`);
    }
  }
  for (const field of MEASURES) {
    const value = body[field];
    if (value !== undefined && value !== null && (typeof value !== 'number' || value < 0)) {
      problems.push(`${field} must not be less than 0`);
    }
  }
  return problems;
}

export const catalogRoutes: MockRoutes = {
  'GET /units-of-measure': () => {
    const auth = authorize('catalog.read');
    if (auth.error) return auth.error;
    return { status: 200, data: [...units].sort((a, b) => a.code.localeCompare(b.code)) };
  },

  'GET /categories': ({ query }) => {
    const auth = authorize('catalog.read');
    if (auth.error) return auth.error;
    const status = query.status ?? 'ALL';
    const list = categories
      .filter((row) => row.organizationId === auth.user.organization_id)
      .filter((row) => status === 'ALL' || (status === 'ACTIVE') === row.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { status: 200, data: list.map(toCategoryDto) };
  },

  'POST /categories': ({ body }) => {
    const auth = authorize('category.manage');
    if (auth.error) return auth.error;
    const input = (body ?? {}) as { name?: unknown; parentId?: unknown; description?: unknown };
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 80) {
      return error(400, 'VALIDATION', 'name should not be empty');
    }
    const description =
      typeof input.description === 'string' ? input.description.trim() || null : null;
    const parentId = typeof input.parentId === 'number' ? input.parentId : null;
    const organizationId = auth.user.organization_id;
    if (parentId !== null && !findCategory(organizationId, parentId)?.isActive) {
      return error(400, 'CATEGORY_PARENT_INVALID', 'Parent category not found or inactive');
    }
    if (nameTaken(organizationId, name, parentId)) {
      return error(409, 'CATEGORY_NAME_TAKEN', 'A sibling category already has this name');
    }

    const now = new Date().toISOString();
    const row: CategoryRow = {
      id: nextId(categories),
      organizationId,
      name,
      description,
      parentId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    categories.push(row);
    return { status: 201, data: toCategoryDto(row) };
  },

  'GET /categories/:id': ({ params }) => {
    const auth = authorize('catalog.read');
    if (auth.error) return auth.error;
    const row = findCategory(auth.user.organization_id, Number(params.id));
    if (!row) return error(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    return { status: 200, data: toCategoryDto(row) };
  },

  // The rules of `CategoriesService.update` in pango-core.
  'PATCH /categories/:id': ({ params, body }) => {
    const auth = authorize('category.manage');
    if (auth.error) return auth.error;
    const organizationId = auth.user.organization_id;
    const row = findCategory(organizationId, Number(params.id));
    if (!row) return error(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    const input = (body ?? {}) as Record<string, unknown>;
    if (input.name !== undefined) {
      const trimmed = typeof input.name === 'string' ? input.name.trim() : '';
      if (!trimmed || trimmed.length > 80) {
        return error(400, 'VALIDATION', 'name should not be empty');
      }
    }
    const name = typeof input.name === 'string' ? input.name.trim() : row.name;
    const parentId =
      input.parentId === undefined
        ? row.parentId
        : typeof input.parentId === 'number'
          ? input.parentId
          : null;
    const isActive = typeof input.isActive === 'boolean' ? input.isActive : row.isActive;

    if (parentId !== row.parentId && parentId !== null) {
      if (withDescendants(organizationId, row.id).has(parentId)) {
        return error(400, 'CATEGORY_CYCLE', 'A category cannot move under itself or a descendant');
      }
    }
    if (parentId !== null && isActive && (parentId !== row.parentId || !row.isActive)) {
      if (!findCategory(organizationId, parentId)?.isActive) {
        return error(400, 'CATEGORY_PARENT_INVALID', 'Parent category not found or inactive');
      }
    }
    if (
      (name !== row.name || parentId !== row.parentId) &&
      nameTaken(organizationId, name, parentId, row.id)
    ) {
      return error(409, 'CATEGORY_NAME_TAKEN', 'A sibling category already has this name');
    }
    if (!isActive && row.isActive) {
      const activeChildren = categories.some(
        (child) =>
          child.organizationId === organizationId && child.parentId === row.id && child.isActive,
      );
      if (activeChildren) {
        return error(409, 'CATEGORY_HAS_ACTIVE_CHILDREN', 'Deactivate its subcategories first');
      }
    }

    row.name = name;
    row.parentId = parentId;
    row.isActive = isActive;
    if (input.description !== undefined) {
      row.description =
        typeof input.description === 'string' ? input.description.trim() || null : null;
    }
    row.updatedAt = new Date().toISOString();
    return { status: 200, data: toCategoryDto(row) };
  },

  'GET /products': ({ query }) => {
    const auth = authorize('catalog.read');
    if (auth.error) return auth.error;
    const organizationId = auth.user.organization_id;
    const search = (query.search ?? '').trim().toLowerCase();
    const status = query.status ?? 'ACTIVE';
    const family = query.categoryId
      ? withDescendants(organizationId, Number(query.categoryId))
      : null;
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25)));

    const matches = products
      .filter((row) => row.organizationId === organizationId)
      .filter((row) => status === 'ALL' || (status === 'ACTIVE') === row.isActive)
      .filter((row) => !family || family.has(row.categoryId))
      .filter(
        (row) =>
          !search ||
          row.name.toLowerCase().includes(search) ||
          row.sku.toLowerCase().includes(search),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    return {
      status: 200,
      data: {
        items: matches.slice((page - 1) * pageSize, page * pageSize).map(toProductDto),
        total: matches.length,
        page,
        pageSize,
      },
    };
  },

  'POST /products': ({ body }) => {
    const auth = authorize('product.manage');
    if (auth.error) return auth.error;
    const input = (body ?? {}) as Record<string, unknown>;
    const problems = validateProduct(input);
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));

    const organizationId = auth.user.organization_id;
    const sku = (input.sku as string).trim();
    if (!findCategory(organizationId, input.categoryId as number)?.isActive) {
      return error(400, 'CATEGORY_INVALID', 'Category not found or inactive');
    }
    if (!findUnit(input.stockUnitId as number)) {
      return error(400, 'STOCK_UNIT_INVALID', 'Unit of measure not found');
    }
    const taken = products.some(
      (row) => row.organizationId === organizationId && row.sku.toLowerCase() === sku.toLowerCase(),
    );
    if (taken) return error(409, 'SKU_TAKEN', 'Another product already uses this code');

    const now = new Date().toISOString();
    const measure = (field: (typeof MEASURES)[number]) => (input[field] as number | null) ?? null;
    const row: ProductRow = {
      id: nextId(products),
      organizationId,
      sku,
      name: (input.name as string).trim(),
      description: typeof input.description === 'string' ? input.description.trim() || null : null,
      categoryId: input.categoryId as number,
      stockUnitId: input.stockUnitId as number,
      lengthCm: measure('lengthCm'),
      widthCm: measure('widthCm'),
      heightCm: measure('heightCm'),
      weightKg: measure('weightKg'),
      volumeL: measure('volumeL'),
      tracksLots: input.tracksLots === true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    products.push(row);
    return { status: 201, data: toProductDto(row) };
  },

  'GET /products/:id': ({ params }) => {
    const auth = authorize('catalog.read');
    if (auth.error) return auth.error;
    const row = findProduct(auth.user.organization_id, params.id);
    if (!row) return error(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    return { status: 200, data: toProductDetailDto(row) };
  },

  'PATCH /products/:id': ({ params, body }) => {
    const auth = authorize('product.manage');
    if (auth.error) return auth.error;
    const organizationId = auth.user.organization_id;
    const row = findProduct(organizationId, params.id);
    if (!row) return error(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    const input = (body ?? {}) as Record<string, unknown>;
    const problems = validateProduct(input, true);
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));
    const locked = hasMovements(organizationId, row.id);

    const sku = typeof input.sku === 'string' ? input.sku.trim() : undefined;
    if (sku !== undefined && sku !== row.sku) {
      if (locked)
        return error(409, 'SKU_LOCKED', 'The code of a product with movements cannot be changed');
      const taken = products.some(
        (other) =>
          other.organizationId === organizationId &&
          other.id !== row.id &&
          other.sku.toLowerCase() === sku.toLowerCase(),
      );
      if (taken) return error(409, 'SKU_TAKEN', 'Another product already uses this code');
    }
    if (typeof input.tracksLots === 'boolean' && input.tracksLots !== row.tracksLots && locked) {
      return error(
        409,
        'TRACKS_LOTS_LOCKED',
        'Lot tracking cannot be changed once the product has movements or lots',
      );
    }
    if (input.categoryId !== undefined && input.categoryId !== row.categoryId) {
      if (!findCategory(organizationId, input.categoryId as number)?.isActive) {
        return error(400, 'CATEGORY_INVALID', 'Category not found or inactive');
      }
    }
    if (input.stockUnitId !== undefined && !findUnit(input.stockUnitId as number)) {
      return error(400, 'STOCK_UNIT_INVALID', 'Unit of measure not found');
    }

    if (sku !== undefined) row.sku = sku;
    if (typeof input.name === 'string') row.name = input.name.trim();
    if (input.description !== undefined) {
      row.description =
        typeof input.description === 'string' ? input.description.trim() || null : null;
    }
    if (input.categoryId !== undefined) row.categoryId = input.categoryId as number;
    if (input.stockUnitId !== undefined) row.stockUnitId = input.stockUnitId as number;
    for (const field of MEASURES) {
      if (input[field] !== undefined) row[field] = input[field] as number | null;
    }
    if (typeof input.tracksLots === 'boolean') row.tracksLots = input.tracksLots;
    if (typeof input.isActive === 'boolean') row.isActive = input.isActive;
    row.updatedAt = new Date().toISOString();
    return { status: 200, data: toProductDto(row) };
  },
};

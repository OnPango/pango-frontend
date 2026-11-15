/** The unit every quantity of a product is counted in (stock, movements, requests). */
export interface UnitOfMeasure {
  id: string;
  /** UN/ECE code (`EA`, `KGM`…). */
  code: string;
  name: string;
}

/** A product family. Families nest: `parentId` points to the family above. */
export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  /** Products directly in this family, not in its subfamilies. */
  productCount: number;
}

export interface Product {
  id: string;
  /** Product code, unique in the organization. */
  sku: string;
  name: string;
  description: string | null;
  category: { id: string; name: string };
  stockUnit: UnitOfMeasure;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  volumeL: number | null;
  /** Stock is kept per lot; otherwise only the quantity matters. */
  tracksLots: boolean;
  /** False: archived (products are never deleted). */
  isActive: boolean;
  createdAt: string;
}

/** `GET /products/:id`: the product plus what decides which fields can still change. */
export interface ProductDetail extends Product {
  /** Once true, the code and the tracking can no longer change. */
  hasMovements: boolean;
  /** On-hand quantity across every warehouse, in the product's unit. */
  totalOnHand: number;
}

export type ProductStatusFilter = 'active' | 'inactive' | 'all';

export interface ProductFilters {
  /** Matches code or name. */
  search: string;
  /** Includes its subfamilies. Null: every family. */
  categoryId: string | null;
  status: ProductStatusFilter;
  /** 1-based. */
  page: number;
  pageSize: number;
}

export interface ProductPage {
  items: Product[];
  /** Products matching the filters, across every page. */
  total: number;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  stockUnitId: string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  volumeL: number | null;
  tracksLots: boolean;
}

/** `PATCH /products/:id`: only the fields that changed; `null` clears a measure. */
export type UpdateProductInput = Partial<CreateProductInput>;

export interface CreateCategoryInput {
  name: string;
  /** The family above; null or absent: a top-level family. */
  parentId?: string | null;
  description?: string | null;
}

/** `PATCH /categories/:id`: only what changed. `parentId: null` moves it to the top level. */
export interface UpdateCategoryInput {
  name?: string;
  parentId?: string | null;
  description?: string | null;
  isActive?: boolean;
}

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
  parentId: string | null;
  isActive: boolean;
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

export interface CreateCategoryInput {
  name: string;
}

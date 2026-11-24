/**
 * Bodies of the catalog endpoints (`docs/catalog.md` in pango-core), as the API names them. Only
 * `products.mappers.ts` and `products.api.ts` know these shapes; the rest of the feature uses the
 * types in `types/products.types.ts`.
 */

/** `GET /units-of-measure` */
export interface UnitOfMeasureDto {
  id: number;
  code: string;
  name: string;
}

/** `GET /categories`: a flat list, nested through `parentId`. */
export interface CategoryDto {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A product in `GET /products` and the answer of `POST /products`. */
export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: { id: number; name: string };
  stockUnit: UnitOfMeasureDto;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  volumeL: number | null;
  tracksLots: boolean;
  /** Absent before pango-core exposed it. */
  averageCost?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Per enabled warehouse in `GET /products/:id`. */
export interface WarehouseStockDto {
  warehouse: { id: number; name: string };
  onHand: number;
  safetyStock: number;
  reorderPoint: number;
  valueSource: 'MANUAL' | 'CALCULATED';
}

/** `GET /products/:id` */
export interface ProductDetailDto extends ProductDto {
  totalOnHand: number;
  warehouses: WarehouseStockDto[];
  /** true: the code and lot tracking can no longer change. */
  hasMovements: boolean;
}

/** `GET /products` */
export interface ProductPageDto {
  items: ProductDto[];
  total: number;
  page: number;
  pageSize: number;
}

export type CatalogStatusFilterDto = 'ACTIVE' | 'INACTIVE' | 'ALL';

/** `GET /products` query. */
export interface ListProductsQueryDto {
  search?: string;
  categoryId?: number;
  status: CatalogStatusFilterDto;
  page: number;
  pageSize: number;
}

/** `POST /products`: `sku`, `name`, `categoryId` and `stockUnitId` are required. */
export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string | null;
  categoryId: number;
  stockUnitId: number;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  volumeL?: number | null;
  tracksLots?: boolean;
}

/** `PATCH /products/:id`: any field of the create body, plus `isActive`. */
export type UpdateProductDto = Partial<CreateProductDto> & { isActive?: boolean };

/** `POST /categories` */
export interface CreateCategoryDto {
  name: string;
  parentId?: number | null;
  description?: string | null;
}

/** `PATCH /categories/:id`: rename, move (`parentId: null` = top level) or (de)activate. */
export type UpdateCategoryDto = Partial<CreateCategoryDto> & { isActive?: boolean };

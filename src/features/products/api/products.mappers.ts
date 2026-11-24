import type {
  CreateCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductDetail,
  ProductFilters,
  ProductStatusFilter,
  UnitOfMeasure,
  UpdateCategoryInput,
  UpdateProductInput,
} from '../types/products.types';
import type {
  CatalogStatusFilterDto,
  CategoryDto,
  CreateCategoryDto,
  CreateProductDto,
  ListProductsQueryDto,
  ProductDetailDto,
  ProductDto,
  UnitOfMeasureDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from './products.dto';

// ---- Responses → domain ----

export const toUnitOfMeasure = (dto: UnitOfMeasureDto): UnitOfMeasure => ({
  id: String(dto.id),
  code: dto.code,
  name: dto.name,
});

export const toProductCategory = (dto: CategoryDto): ProductCategory => ({
  id: String(dto.id),
  name: dto.name,
  description: dto.description,
  parentId: dto.parentId === null ? null : String(dto.parentId),
  isActive: dto.isActive,
  productCount: dto.productCount,
});

export const toProduct = (dto: ProductDto): Product => ({
  id: String(dto.id),
  sku: dto.sku,
  name: dto.name,
  description: dto.description,
  category: { id: String(dto.category.id), name: dto.category.name },
  stockUnit: toUnitOfMeasure(dto.stockUnit),
  lengthCm: dto.lengthCm,
  widthCm: dto.widthCm,
  heightCm: dto.heightCm,
  weightKg: dto.weightKg,
  volumeL: dto.volumeL,
  tracksLots: dto.tracksLots,
  averageCost: dto.averageCost ?? 0,
  isActive: dto.isActive,
  createdAt: dto.createdAt,
});

export const toProductDetail = (dto: ProductDetailDto): ProductDetail => ({
  ...toProduct(dto),
  hasMovements: dto.hasMovements,
  totalOnHand: dto.totalOnHand,
});

// ---- Domain → requests ----

const STATUS_DTO: Record<ProductStatusFilter, CatalogStatusFilterDto> = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  all: 'ALL',
};

export const toListProductsQuery = (filters: ProductFilters): ListProductsQueryDto => ({
  ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
  ...(filters.categoryId ? { categoryId: Number(filters.categoryId) } : {}),
  status: STATUS_DTO[filters.status],
  page: filters.page,
  pageSize: filters.pageSize,
});

export const toCreateProductDto = (input: CreateProductInput): CreateProductDto => ({
  sku: input.sku.trim(),
  name: input.name.trim(),
  description: input.description?.trim() || null,
  categoryId: Number(input.categoryId),
  stockUnitId: Number(input.stockUnitId),
  lengthCm: input.lengthCm,
  widthCm: input.widthCm,
  heightCm: input.heightCm,
  weightKg: input.weightKg,
  volumeL: input.volumeL,
  tracksLots: input.tracksLots,
});

const toParentId = (id: string | null | undefined) => (id ? Number(id) : null);

export const toCreateCategoryDto = (input: CreateCategoryInput): CreateCategoryDto => ({
  name: input.name.trim(),
  ...(input.parentId ? { parentId: Number(input.parentId) } : {}),
  ...(input.description?.trim() ? { description: input.description.trim() } : {}),
});

/** Only the fields present in `input`; an empty description clears it. */
export function toUpdateCategoryDto(input: UpdateCategoryInput): UpdateCategoryDto {
  const dto: UpdateCategoryDto = {};
  if (input.name !== undefined) dto.name = input.name.trim();
  if (input.parentId !== undefined) dto.parentId = toParentId(input.parentId);
  if (input.description !== undefined) dto.description = input.description?.trim() || null;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
}

/** Only the fields present in `input`, so the API leaves the others untouched. */
export function toUpdateProductDto(input: UpdateProductInput): UpdateProductDto {
  const dto: UpdateProductDto = {};
  if (input.sku !== undefined) dto.sku = input.sku.trim();
  if (input.name !== undefined) dto.name = input.name.trim();
  if (input.description !== undefined) dto.description = input.description?.trim() || null;
  if (input.categoryId !== undefined) dto.categoryId = Number(input.categoryId);
  if (input.stockUnitId !== undefined) dto.stockUnitId = Number(input.stockUnitId);
  for (const field of ['lengthCm', 'widthCm', 'heightCm', 'weightKg', 'volumeL'] as const) {
    if (input[field] !== undefined) dto[field] = input[field];
  }
  if (input.tracksLots !== undefined) dto.tracksLots = input.tracksLots;
  return dto;
}

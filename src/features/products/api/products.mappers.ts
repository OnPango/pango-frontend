import type {
  CreateCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductFilters,
  ProductStatusFilter,
  UnitOfMeasure,
} from '../types/products.types';
import type {
  CatalogStatusFilterDto,
  CategoryDto,
  CreateCategoryDto,
  CreateProductDto,
  ListProductsQueryDto,
  ProductDto,
  UnitOfMeasureDto,
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
  isActive: dto.isActive,
  createdAt: dto.createdAt,
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

export const toCreateCategoryDto = (input: CreateCategoryInput): CreateCategoryDto => ({
  name: input.name.trim(),
});

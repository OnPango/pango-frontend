import { http } from '@/core/api/http';
import type {
  CreateCategoryInput,
  CreateProductInput,
  Product,
  ProductCategory,
  ProductDetail,
  ProductFilters,
  ProductPage,
  UnitOfMeasure,
  UpdateProductInput,
} from '../types/products.types';
import type {
  CategoryDto,
  ProductDetailDto,
  ProductDto,
  ProductPageDto,
  UnitOfMeasureDto,
} from './products.dto';
import {
  toCreateCategoryDto,
  toCreateProductDto,
  toListProductsQuery,
  toProduct,
  toProductCategory,
  toProductDetail,
  toUnitOfMeasure,
  toUpdateProductDto,
} from './products.mappers';

/**
 * Every call to the catalog endpoints, in one place. They answer with the domain types of
 * `types/products.types.ts`, never with the raw bodies (`products.dto.ts`).
 */

// ---- Products ----

/** `GET /products`: one page, sorted by name. No matches is an empty page, not an error. */
export async function getProducts(filters: ProductFilters): Promise<ProductPage> {
  const { data } = await http.get<ProductPageDto>('/products', {
    params: toListProductsQuery(filters),
  });
  return { items: data.items.map(toProduct), total: data.total };
}

/** `POST /products`: the product starts with no stock; stock arrives with an inbound movement. */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await http.post<ProductDto>('/products', toCreateProductDto(input));
  return toProduct(data);
}

/** `GET /products/:id`: includes whether the code and the tracking are locked. */
export async function getProduct(id: string): Promise<ProductDetail> {
  const { data } = await http.get<ProductDetailDto>(`/products/${id}`);
  return toProductDetail(data);
}

/** `PATCH /products/:id`: sends only the changed fields. */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const { data } = await http.patch<ProductDto>(`/products/${id}`, toUpdateProductDto(input));
  return toProduct(data);
}

// ---- Families and units ----

/** `GET /categories`: every family, active or not, as a flat list. */
export async function getCategories(): Promise<ProductCategory[]> {
  const { data } = await http.get<CategoryDto[]>('/categories', { params: { status: 'ALL' } });
  return data.map(toProductCategory);
}

/** `POST /categories`: a top-level family. */
export async function createCategory(input: CreateCategoryInput): Promise<ProductCategory> {
  const { data } = await http.post<CategoryDto>('/categories', toCreateCategoryDto(input));
  return toProductCategory(data);
}

/** `GET /units-of-measure`: seeded by the backend, the same in every organization. */
export async function getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  const { data } = await http.get<UnitOfMeasureDto[]>('/units-of-measure');
  return data.map(toUnitOfMeasure);
}

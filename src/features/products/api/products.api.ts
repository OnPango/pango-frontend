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
  UpdateCategoryInput,
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
  toUpdateCategoryDto,
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

/** The most `GET /products` gives per page. */
const MAX_PAGE_SIZE = 100;

/**
 * The whole catalog, active and archived, so the list can search and filter it in the browser
 * (by family too, which the API search does not cover). The first page says how many follow;
 * those are asked for together.
 */
export async function getAllProducts(): Promise<Product[]> {
  const query = { search: '', categoryId: null, status: 'all', pageSize: MAX_PAGE_SIZE } as const;
  const first = await getProducts({ ...query, page: 1 });
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      getProducts({ ...query, page: index + 2 }),
    ),
  );
  return [first, ...rest].flatMap((page) => page.items);
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

/** `POST /categories`: a family, at the top level or under `parentId`. */
export async function createCategory(input: CreateCategoryInput): Promise<ProductCategory> {
  const { data } = await http.post<CategoryDto>('/categories', toCreateCategoryDto(input));
  return toProductCategory(data);
}

/** `PATCH /categories/:id`: rename, move or (de)activate a family. */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<ProductCategory> {
  const { data } = await http.patch<CategoryDto>(`/categories/${id}`, toUpdateCategoryDto(input));
  return toProductCategory(data);
}

/** `GET /units-of-measure`: seeded by the backend, the same in every organization. */
export async function getUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  const { data } = await http.get<UnitOfMeasureDto[]>('/units-of-measure');
  return data.map(toUnitOfMeasure);
}

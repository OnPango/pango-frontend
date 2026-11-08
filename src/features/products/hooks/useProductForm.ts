import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { useCreateProduct, useUpdateProduct } from '../api/products.queries';
import { productsErrorMessage } from '../content/products.errors';
import type { CreateProductInput, Product, UpdateProductInput } from '../types/products.types';
import {
  EMPTY_PRODUCT_FORM,
  productSchema,
  toMeasure,
  toProductFormValues,
  type ProductFormValues,
} from '../types/product.schema';

/** API errors shown on their field instead of the banner. */
const FIELD_ERRORS = {
  SKU_TAKEN: 'sku',
  SKU_LOCKED: 'sku',
  CATEGORY_INVALID: 'categoryId',
  STOCK_UNIT_INVALID: 'stockUnitId',
  TRACKS_LOTS_LOCKED: 'tracking',
} as const satisfies Record<string, keyof ProductFormValues>;

const fieldOf = (error: unknown) => {
  const code = getApiErrorCode(error);
  return code && code in FIELD_ERRORS ? FIELD_ERRORS[code as keyof typeof FIELD_ERRORS] : null;
};

const toInput = (values: ProductFormValues): CreateProductInput => ({
  sku: values.sku,
  name: values.name,
  description: values.description || null,
  categoryId: values.categoryId,
  stockUnitId: values.stockUnitId,
  tracksLots: values.tracking === 'lot',
  lengthCm: toMeasure(values.lengthCm),
  widthCm: toMeasure(values.widthCm),
  heightCm: toMeasure(values.heightCm),
  weightKg: toMeasure(values.weightKg),
  volumeL: toMeasure(values.volumeL),
});

/** The fields of `next` that differ from `saved`, so an edit only sends what changed. */
function changes(saved: CreateProductInput, next: CreateProductInput): UpdateProductInput {
  const diff: UpdateProductInput = {};
  for (const key of Object.keys(next) as (keyof CreateProductInput)[]) {
    const before = typeof saved[key] === 'string' ? (saved[key] as string).trim() : saved[key];
    const after = typeof next[key] === 'string' ? (next[key] as string).trim() : next[key];
    if (before !== after) Object.assign(diff, { [key]: next[key] });
  }
  return diff;
}

/**
 * State and rules of the product form, to register a product or edit `product`: validation, the
 * request, and which API errors belong to a field (a taken code, a locked tracking…).
 */
export function useProductForm({
  product,
  onSaved,
}: {
  product?: Product;
  onSaved: (product: Product) => void;
}) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?.id ?? '');
  const mutation = product ? updateProduct : createProduct;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: 'onTouched',
    defaultValues: product ? toProductFormValues(product) : EMPTY_PRODUCT_FORM,
  });

  const onError = (error: unknown) => {
    const field = fieldOf(error);
    if (field) {
      const message = productsErrorMessage(error, 'No se pudo guardar el producto.');
      form.setError(field, { message }, { shouldFocus: field === 'sku' });
    }
  };

  const submit = form.handleSubmit((values) => {
    const input = toInput(values);
    if (!product) {
      createProduct.mutate(input, { onSuccess: onSaved, onError });
      return;
    }
    const diff = changes(toInput(toProductFormValues(product)), input);
    if (Object.keys(diff).length === 0) {
      onSaved(product);
      return;
    }
    updateProduct.mutate(diff, { onSuccess: onSaved, onError });
  });

  return {
    form,
    submit,
    isSubmitting: mutation.isPending,
    /** Errors that are not about one field (permissions, network…). */
    serverError:
      mutation.isError && !fieldOf(mutation.error)
        ? productsErrorMessage(mutation.error, 'No se pudo guardar el producto.')
        : null,
  };
}

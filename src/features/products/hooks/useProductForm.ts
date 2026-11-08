import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { useCreateProduct } from '../api/products.queries';
import { productsErrorMessage } from '../content/products.errors';
import type { Product } from '../types/products.types';
import {
  EMPTY_PRODUCT_FORM,
  productSchema,
  toMeasure,
  type ProductFormValues,
} from '../types/product.schema';

/**
 * State and rules of the "new product" form: validation, the request, and which API errors belong
 * to a field (a taken code, an inactive family) instead of the banner.
 */
export function useProductForm(onCreated: (product: Product) => void) {
  const createProduct = useCreateProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_PRODUCT_FORM,
  });

  const submit = form.handleSubmit((values) => {
    createProduct.mutate(
      {
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
      },
      {
        onSuccess: onCreated,
        onError: (error) => {
          const code = getApiErrorCode(error);
          const message = productsErrorMessage(error, 'No se pudo guardar el producto.');
          if (code === 'SKU_TAKEN') form.setError('sku', { message }, { shouldFocus: true });
          if (code === 'CATEGORY_INVALID') form.setError('categoryId', { message });
          if (code === 'STOCK_UNIT_INVALID') form.setError('stockUnitId', { message });
        },
      },
    );
  });

  const errorCode = getApiErrorCode(createProduct.error);
  const fieldError =
    errorCode === 'SKU_TAKEN' ||
    errorCode === 'CATEGORY_INVALID' ||
    errorCode === 'STOCK_UNIT_INVALID';

  return {
    form,
    submit,
    isSubmitting: createProduct.isPending,
    /** Errors that are not about one field (permissions, network…). */
    serverError:
      createProduct.isError && !fieldError
        ? productsErrorMessage(createProduct.error, 'No se pudo guardar el producto.')
        : null,
  };
}

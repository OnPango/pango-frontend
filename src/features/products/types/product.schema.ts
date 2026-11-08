import { z } from 'zod';
import type { Product } from './products.types';

/** Optional non-negative number typed by hand: a comma works as decimal separator. */
const measure = (decimals: number, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || new RegExp(`^\\d+([.,]\\d{1,${decimals}})?$`).test(value),
      `Escribe un número mayor o igual a 0, con hasta ${decimals} decimales.`,
    )
    .refine(
      (value) => value === '' || Number(value.replace(',', '.')) <= max,
      `El valor máximo es ${max.toLocaleString('es-CO')}.`,
    );

export const MAX_VOLUME_L = 9_999_999_999;

/** "New product" form. Limits mirror `CreateProductDto` in pango-core. */
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre del producto.')
    .max(150, 'Máximo 150 caracteres.'),
  sku: z.string().trim().min(1, 'Escribe el código del producto.').max(40, 'Máximo 40 caracteres.'),
  categoryId: z.string().min(1, 'Elige una familia.'),
  stockUnitId: z.string().min(1, 'Elige la unidad de medida.'),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
  tracking: z.enum(['quantity', 'lot']),
  lengthCm: measure(2, 99_999_999),
  widthCm: measure(2, 99_999_999),
  heightCm: measure(2, 99_999_999),
  weightKg: measure(4, 99_999_999),
  volumeL: measure(4, MAX_VOLUME_L),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '',
  sku: '',
  categoryId: '',
  stockUnitId: '',
  description: '',
  tracking: 'quantity',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  weightKg: '',
  volumeL: '',
};

/** A validated measure as the API wants it: a number, or null when left empty. */
export const toMeasure = (value: string): number | null =>
  value.trim() === '' ? null : Number(value.trim().replace(',', '.'));

/** A saved product as the form shows it, to edit it. */
export function toProductFormValues(product: Product): ProductFormValues {
  const text = (value: number | null) => (value === null ? '' : String(value));
  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.category.id,
    stockUnitId: product.stockUnit.id,
    description: product.description ?? '',
    tracking: product.tracksLots ? 'lot' : 'quantity',
    lengthCm: text(product.lengthCm),
    widthCm: text(product.widthCm),
    heightCm: text(product.heightCm),
    weightKg: text(product.weightKg),
    volumeL: text(product.volumeL),
  };
}

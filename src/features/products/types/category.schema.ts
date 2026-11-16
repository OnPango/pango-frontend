import { z } from 'zod';
import type { ProductCategory } from './products.types';

/** "Nueva familia" / "Editar familia". Limits mirror `CreateCategoryDto` in pango-core. */
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de la familia.')
    .max(80, 'Máximo 80 caracteres.'),
  /** '' = a top-level family. */
  parentId: z.string(),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const toCategoryFormValues = (
  category: ProductCategory | undefined,
  parentId: string | null = null,
): CategoryFormValues => ({
  name: category?.name ?? '',
  parentId: (category ? category.parentId : parentId) ?? '',
  description: category?.description ?? '',
});

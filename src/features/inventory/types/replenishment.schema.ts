import { z } from 'zod';

/** A quantity that may be 0, with up to 4 decimals (a comma works too). */
const value = z
  .string()
  .trim()
  .refine(
    (text) => /^\d+([.,]\d{1,4})?$/.test(text),
    'Escribe un número mayor o igual a 0, con hasta 4 decimales.',
  );

export const toNumber = (text: string) => Number(text.trim().replace(',', '.'));

/**
 * US-016. Mirrors pango-core: the safety stock cannot exceed the reorder point (unless the reorder
 * point is 0, "no alerts"), and the reorder point cannot exceed the max stock when there is one.
 */
export const replenishmentSchema = (maxStock: number | null) =>
  z.object({ safetyStock: value, reorderPoint: value }).superRefine((values, ctx) => {
    const safety = toNumber(values.safetyStock);
    const reorder = toNumber(values.reorderPoint);
    if (Number.isNaN(safety) || Number.isNaN(reorder)) return;
    if (reorder > 0 && safety > reorder) {
      ctx.addIssue({
        code: 'custom',
        path: ['safetyStock'],
        message: 'No puede superar el punto de reorden.',
      });
    }
    if (maxStock !== null && reorder > maxStock) {
      ctx.addIssue({
        code: 'custom',
        path: ['reorderPoint'],
        message: `No puede superar el stock máximo configurado (${maxStock.toLocaleString('es-CO')}).`,
      });
    }
  });

export type ReplenishmentFormValues = z.infer<ReturnType<typeof replenishmentSchema>>;

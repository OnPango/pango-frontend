import { z } from 'zod';
import { MAX_LEAD_TIME_DAYS, MIN_LEAD_TIME_DAYS } from '@/shared/lib/reorderPoint';

/** A quantity that may be 0, with up to 4 decimals (a comma works too). */
const value = z
  .string()
  .trim()
  .refine(
    (text) => /^\d+([.,]\d{1,4})?$/.test(text),
    'Escribe un número mayor o igual a 0, con hasta 4 decimales.',
  );

export const toNumber = (text: string) => Number(text.trim().replace(',', '.'));

/** Integer lead time between 1 and 365 days; null while typing anything else. */
export function toLeadTimeDays(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const days = Number(trimmed);
  if (days < MIN_LEAD_TIME_DAYS || days > MAX_LEAD_TIME_DAYS) return null;
  return days;
}

const leadTimeDays = z
  .string()
  .trim()
  .refine(
    (text) => toLeadTimeDays(text) !== null,
    `Escribe un número entero entre ${MIN_LEAD_TIME_DAYS} y ${MAX_LEAD_TIME_DAYS} días.`,
  );

/**
 * US-016 / US-040. Mirrors pango-core: manual safety stock cannot exceed manual reorder point
 * (unless the reorder point is 0, "no alerts"), and manual reorder point cannot exceed max stock
 * when there is one.
 */
export const replenishmentSchema = (maxStock: number | null) =>
  z
    .object({
      method: z.enum(['manual', 'forecast']),
      leadTimeDays,
      safetyStock: value,
      reorderPoint: value,
    })
    .superRefine((values, ctx) => {
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

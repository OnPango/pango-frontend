import { z } from 'zod';

/** The lot option for a lot that has no stock in the warehouse (the count found some). */
export const NEW_LOT = '__new__';

/** What was counted: zero or more (finding none is a count too), with up to 4 decimals. */
const counted = z
  .string()
  .trim()
  .refine(
    (value) => /^\d+([.,]\d{1,4})?$/.test(value),
    'Escribe lo que contaste: cero o más, con hasta 4 decimales.',
  )
  .refine(
    (value) => Number(value.replace(',', '.')) <= 9_999_999_999,
    'La cantidad es demasiado grande.',
  );

/** "Registrar ajuste". Limits mirror `CreateMovementDto` in pango-core. */
export const adjustmentSchema = z.object({
  warehouseId: z.string().min(1, 'Elige el almacén.'),
  movementTypeId: z.string().min(1, 'Elige el tipo de ajuste.'),
  productId: z.string().min(1, 'Elige el producto.'),
  /** A lot code, or `NEW_LOT`. Required only for products that track lots; the form checks that. */
  lot: z.string(),
  newLot: z.string().trim().max(40, 'Máximo 40 caracteres.'),
  counted,
  // RN-006: the correction stays in the history, so it says why.
  notes: z
    .string()
    .trim()
    .min(1, 'Cuenta por qué se ajusta: queda en el historial.')
    .max(2000, 'Máximo 2000 caracteres.'),
  documentRef: z.string().trim().max(40, 'Máximo 40 caracteres.'),
});

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

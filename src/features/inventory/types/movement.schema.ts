import { z } from 'zod';

/** CU-05: a quantity greater than zero, with up to 4 decimals (a comma works too). */
const quantity = z
  .string()
  .trim()
  .refine(
    (value) => /^\d+([.,]\d{1,4})?$/.test(value) && Number(value.replace(',', '.')) > 0,
    'Escribe una cantidad mayor que cero, con hasta 4 decimales.',
  )
  .refine(
    (value) => Number(value.replace(',', '.')) <= 9_999_999_999,
    'La cantidad es demasiado grande.',
  );

/** "Registrar entrada" / "Registrar salida". Limits mirror `CreateMovementDto` in pango-core. */
export const movementSchema = z.object({
  warehouseId: z.string().min(1, 'Elige el almacén.'),
  movementTypeId: z.string().min(1, 'Elige el motivo.'),
  productId: z.string().min(1, 'Elige el producto.'),
  quantity,
  /** Required only for products that track lots; the form checks that. */
  lotCode: z.string().trim().max(40, 'Máximo 40 caracteres.'),
  documentRef: z.string().trim().max(40, 'Máximo 40 caracteres.'),
});

export type MovementFormValues = z.infer<typeof movementSchema>;

export const toQuantity = (value: string) => Number(value.trim().replace(',', '.'));

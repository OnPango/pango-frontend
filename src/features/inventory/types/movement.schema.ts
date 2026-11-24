import { z } from 'zod';

/** CU-05: a quantity greater than zero, with up to 4 decimals (a comma works too). */
export const quantity = z
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

/**
 * Money as people write it in Colombia: dots group thousands and a comma starts the decimals
 * ("15.000", "1.250,50", "980"). "15.5" is rejected rather than read as fifteen and a half.
 */
const MONEY = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,4})?$/;

export const isMoney = (value: string) => MONEY.test(value.trim());

/** "1.250,5" → 1250.5. Only for values that passed `unitCost`. */
export const toMoney = (value: string) => Number(value.trim().replace(/\./g, '').replace(',', '.'));

/** Optional unit cost of an entry: empty, or zero or more with up to 4 decimals. */
export const unitCost = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || MONEY.test(value),
    'Escribe el costo con puntos para los miles y coma para los decimales, por ejemplo 15.000 o 1.250,50.',
  )
  .refine(
    (value) => value === '' || !MONEY.test(value) || toMoney(value) <= 9_999_999_999,
    'El costo es demasiado grande.',
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
  /** Entries only; ignored on outbound movements. */
  unitCost,
});

export type MovementFormValues = z.infer<typeof movementSchema>;

export const toQuantity = (value: string) => Number(value.trim().replace(',', '.'));

import { z } from 'zod';

/** The most lines `POST /stock-requests` takes. */
export const MAX_LINES = 200;

const quantity = z
  .string()
  .trim()
  .refine(
    (value) => /^\d+([.,]\d{1,4})?$/.test(value) && Number(value.replace(',', '.')) > 0,
    'Mayor que cero, hasta 4 decimales.',
  );

/**
 * "Nueva solicitud" (US-028). At least one line, each with a product and a quantity greater than
 * zero (CU-08 step 5); a product only once.
 */
export const requestSchema = z.object({
  type: z.enum(['internalConsumption', 'internalReplenishment', 'return', 'incident']),
  warehouseId: z.string().min(1, 'Elige el almacén que atiende la solicitud.'),
  priority: z.enum(['1', '2', '3']),
  requiredDate: z.string(),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
  lines: z
    .array(z.object({ productId: z.string().min(1, 'Elige el producto.'), quantity }))
    .min(1, 'Agrega al menos un producto.')
    .max(MAX_LINES, `Máximo ${MAX_LINES} productos por solicitud.`),
});

export type RequestFormValues = z.infer<typeof requestSchema>;

export const EMPTY_LINE = { productId: '', quantity: '' };

export const EMPTY_REQUEST_FORM: RequestFormValues = {
  type: 'internalConsumption',
  warehouseId: '',
  priority: '2',
  requiredDate: '',
  notes: '',
  lines: [EMPTY_LINE],
};

export const toQuantity = (value: string) => Number(value.trim().replace(',', '.'));

import { z } from 'zod';
import { quantity } from './movement.schema';

/** How the stock reaches the destination: it waits to be received, or it is there at once. */
export type TransferArrival = 'transit' | 'now';

/** "Registrar traslado" (CU-16). Limits mirror `CreateMovementDto` in pango-core. */
export const transferSchema = z
  .object({
    originId: z.string().min(1, 'Elige de qué almacén sale.'),
    destinationId: z.string().min(1, 'Elige a qué almacén va.'),
    /** The transfer type; chosen for you when the roles allow only one. */
    movementTypeId: z.string().min(1, 'Elige el motivo.'),
    productId: z.string().min(1, 'Elige el producto.'),
    quantity,
    /** Required only for products that track lots; the form checks that. */
    lotCode: z.string().trim().max(40, 'Máximo 40 caracteres.'),
    arrival: z.enum(['transit', 'now']),
    documentRef: z.string().trim().max(40, 'Máximo 40 caracteres.'),
    notes: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
  })
  .refine((values) => !values.originId || values.originId !== values.destinationId, {
    path: ['destinationId'],
    message: 'El destino tiene que ser otro almacén.',
  });

export type TransferFormValues = z.infer<typeof transferSchema>;

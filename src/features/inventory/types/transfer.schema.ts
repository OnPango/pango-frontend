import { z } from 'zod';
import { quantity } from './movement.schema';

/** How the stock reaches the destination: it waits to be received, or it is there at once. */
export type TransferArrival = 'transit' | 'now';

/** The most lines a movement takes (`MAX_MOVEMENT_LINES` in pango-core). */
export const MAX_TRANSFER_LINES = 200;

const line = z.object({
  productId: z.string().min(1, 'Elige el producto.'),
  quantity,
  /** Required only for products that track lots; the form checks that. */
  lotCode: z.string().trim().max(40, 'Máximo 40 caracteres.'),
});

export const EMPTY_TRANSFER_LINE = { productId: '', quantity: '', lotCode: '' };

/** "Registrar traslado" (CU-16). Limits mirror `CreateMovementDto` in pango-core. */
export const transferSchema = z
  .object({
    originId: z.string().min(1, 'Elige de qué almacén sale.'),
    destinationId: z.string().min(1, 'Elige a qué almacén va.'),
    /** The transfer type; chosen for you when the roles allow only one. */
    movementTypeId: z.string().min(1, 'Elige el motivo.'),
    lines: z
      .array(line)
      .min(1, 'Agrega al menos un producto.')
      .max(MAX_TRANSFER_LINES, `Máximo ${MAX_TRANSFER_LINES} productos por traslado.`),
    arrival: z.enum(['transit', 'now']),
    documentRef: z.string().trim().max(40, 'Máximo 40 caracteres.'),
    notes: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
  })
  .superRefine((values, ctx) => {
    if (values.originId && values.originId === values.destinationId) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationId'],
        message: 'El destino tiene que ser otro almacén.',
      });
    }
    // A product goes once; a per-lot product once per lot.
    const seen = new Set<string>();
    values.lines.forEach((entry, index) => {
      if (!entry.productId) return;
      const key = `${entry.productId}|${entry.lotCode.trim()}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['lines', index, entry.lotCode.trim() ? 'lotCode' : 'productId'],
          message: entry.lotCode.trim()
            ? 'Ese lote ya está en otra línea.'
            : 'Este producto ya está en otra línea.',
        });
      }
      seen.add(key);
    });
  });

export type TransferFormValues = z.infer<typeof transferSchema>;

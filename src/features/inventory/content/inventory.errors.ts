import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the stock and movement endpoints. */
const MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK:
    'No hay suficiente existencia de este producto en el almacén (o en ese lote).',
  LOT_REQUIRED: 'Este producto se sigue por lote: escribe el código del lote.',
  LOT_NOT_ALLOWED: 'Este producto no se sigue por lote.',
  LOT_NOT_FOUND: 'Ese lote no existe para este producto.',
  PRODUCT_INVALID: 'El producto no existe o está archivado.',
  PRODUCT_NOT_FOUND: 'El producto ya no existe.',
  WAREHOUSE_INVALID: 'El almacén no existe o está cerrado.',
  MOVEMENT_TYPE_INVALID: 'El motivo elegido no existe.',
  MOVEMENT_TYPE_NOT_ALLOWED: 'Tus roles en este almacén no permiten registrar este motivo.',
  MOVEMENT_TYPE_NOT_SUPPORTED: 'Los traslados todavía no se pueden registrar.',
  FORBIDDEN: 'No tienes permiso para registrar movimientos en este almacén.',
};

/** Message for a failed stock or movement request: the known code's text, else the API's. */
export function inventoryErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

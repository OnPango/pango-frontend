import { isAxiosError } from 'axios';
import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the stock and movement endpoints. */
const MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK:
    'No hay suficiente existencia de este producto en el almacén (o en ese lote).',
  LOT_REQUIRED: 'Este producto se sigue por lote: escribe el código del lote.',
  LOT_NOT_ALLOWED: 'Este producto no se sigue por lote.',
  LOT_NOT_FOUND: 'Ese lote no existe para este producto.',
  LOT_DATES_INVALID: 'El vencimiento no puede ser anterior a la fabricación.',
  PRODUCT_INVALID: 'El producto no existe o está archivado.',
  PRODUCT_NOT_FOUND: 'El producto ya no existe.',
  WAREHOUSE_INVALID: 'El almacén no existe o está cerrado.',
  MOVEMENT_TYPE_INVALID: 'El motivo elegido no existe.',
  MOVEMENT_TYPE_NOT_ALLOWED: 'Tus roles en este almacén no permiten registrar este motivo.',
  MOVEMENT_TYPE_NOT_SUPPORTED: 'Este tipo de movimiento todavía no se puede registrar.',
  DESTINATION_WAREHOUSE_REQUIRED: 'Elige el almacén al que va el traslado.',
  DESTINATION_WAREHOUSE_INVALID: 'El almacén de destino no existe o está cerrado.',
  SAME_WAREHOUSE: 'El destino tiene que ser otro almacén.',
  TRANSFER_FIELDS_NOT_ALLOWED: 'Solo los traslados llevan almacén de destino.',
  DEPARTMENT_NOT_ALLOWED: 'Los traslados no llevan área.',
  LINE_DIRECTION_INVALID: 'No se pudo saber si el ajuste suma o resta existencia.',
  LOCATION_INVALID: 'La ubicación del almacén no existe o está inactiva.',
  WAREHOUSE_NOT_FOUND: 'El almacén no existe, está cerrado o no tienes acceso a él.',
  FORBIDDEN: 'No tienes permiso para esta operación en este almacén.',
};

/** `REPLENISHMENT_INVALID` carries one of these rules in its message. */
const REPLENISHMENT_RULES: [RegExp, string][] = [
  [/safety stock cannot exceed/i, 'El stock de seguridad no puede superar el punto de reorden.'],
  [/min stock cannot exceed/i, 'El stock mínimo no puede superar el máximo.'],
  [/reorder point cannot exceed/i, 'El punto de reorden no puede superar el stock máximo.'],
];

/** Message for a failed stock, movement or replenishment request: the known code's text, else the API's. */
export function inventoryErrorMessage(error: unknown, fallback: string): string {
  // No answer in time: a write may still have gone through on the server.
  if (isAxiosError(error) && error.code === 'ECONNABORTED' && error.config?.method !== 'get') {
    return 'El servidor tardó demasiado en responder y puede que la operación sí se haya guardado. Revisa la existencia antes de intentarlo de nuevo.';
  }
  const code = getApiErrorCode(error);
  if (code === 'REPLENISHMENT_INVALID') {
    const apiMessage = getApiErrorMessage(error, '');
    const rule = REPLENISHMENT_RULES.find(([pattern]) => pattern.test(apiMessage));
    return rule?.[1] ?? 'Los valores de reposición no son válidos.';
  }
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

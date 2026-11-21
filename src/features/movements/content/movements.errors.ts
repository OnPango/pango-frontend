import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the movement history. */
const MESSAGES: Record<string, string> = {
  MOVEMENT_NOT_FOUND: 'El movimiento no existe o no tienes acceso a su almacén.',
  FORBIDDEN: 'No tienes permiso para ver los movimientos.',
  MOVEMENT_NOT_IN_TRANSIT: 'Este traslado ya fue recibido.',
  DESTINATION_WAREHOUSE_INVALID: 'El almacén de destino está cerrado: no puede recibir.',
  RECEIVED_QUANTITY_INVALID: 'No se puede recibir más de lo que se envió.',
  RECEIPT_LINE_INVALID: 'Una de las líneas no pertenece al traslado.',
  LOCATION_INVALID: 'La ubicación de destino no existe o está inactiva.',
};

export function movementsErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

import { isAxiosError } from 'axios';
import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the stock request endpoints. */
const MESSAGES: Record<string, string> = {
  DEPARTMENT_REQUIRED:
    'No perteneces a ningún área activa, así que no puedes crear solicitudes. Pide a un administrador que te asigne una.',
  WAREHOUSE_INVALID: 'El almacén no existe o está cerrado.',
  PRODUCT_INVALID: 'El producto no existe o está archivado.',
  PRODUCT_DUPLICATED: 'Este producto ya está en la solicitud.',
  STOCK_REQUEST_TYPE_NOT_SUPPORTED: 'Ese tipo de solicitud todavía no está disponible.',
  STOCK_REQUEST_NOT_FOUND: 'La solicitud ya no existe o no tienes acceso a ella.',
  STOCK_REQUEST_STATUS_INVALID:
    'La solicitud ya cambió de estado. Se actualizó con su estado actual.',
  NOT_REQUESTER: 'Solo quien creó la solicitud puede cancelarla.',
  REQUESTER_CANNOT_ATTEND:
    'Quien creó la solicitud no puede atenderla: debe hacerlo otra persona con permiso en el almacén.',
  INSUFFICIENT_STOCK: 'No hay suficiente existencia disponible en el almacén (o en ese lote).',
  LOT_REQUIRED: 'Este producto se sigue por lote: elige el lote.',
  LOT_NOT_ALLOWED: 'Este producto no se sigue por lote.',
  LOT_NOT_FOUND: 'Ese lote no existe para este producto.',
  LINE_INVALID: 'Una de las líneas ya no es parte de la solicitud: recárgala.',
  MOVEMENT_TYPE_NOT_CONFIGURED:
    'La organización no tiene configurado el tipo de salida para solicitudes. Avisa a un administrador.',
  FORBIDDEN: 'No tienes permiso para crear solicitudes en este almacén.',
};

export function requestsErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error) && error.code === 'ECONNABORTED' && error.config?.method !== 'get') {
    return 'El servidor tardó demasiado en responder y puede que la solicitud sí se haya guardado. Revisa la lista antes de intentarlo de nuevo.';
  }
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

/** Line errors say which line: "Line 2: …". */
export function errorLine(error: unknown): number | null {
  const match = /^Line (\d+):/.exec(getApiErrorMessage(error, ''));
  return match ? Number(match[1]) : null;
}

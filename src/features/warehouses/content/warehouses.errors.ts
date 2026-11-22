import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the warehouse endpoints. */
const MESSAGES: Record<string, string> = {
  WAREHOUSE_NAME_TAKEN: 'Ya existe un almacén con ese nombre.',
  WAREHOUSE_CODE_TAKEN: 'Ya existe un almacén con ese código.',
  WAREHOUSE_HAS_STOCK:
    'El almacén todavía tiene existencia. Trasládala a otro almacén, o regístrale una salida o un ajuste, antes de cerrarlo.',
  WAREHOUSE_HAS_TRANSFERS_IN_TRANSIT:
    'Hay traslados en camino desde o hacia este almacén. Recíbelos en Movimientos antes de cerrarlo.',
  WAREHOUSE_NOT_FOUND: 'El almacén ya no existe o no tienes acceso a él.',
  FORBIDDEN: 'No tienes permiso para esta operación.',
};

/** Message for a failed warehouse request: the known code's text, else the API's. */
export function warehousesErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the alert endpoints. */
const MESSAGES: Record<string, string> = {
  ALERT_NOT_FOUND: 'La alerta no existe o no tienes acceso a su almacén.',
  PRODUCT_NOT_FOUND: 'El producto ya no está activo.',
  WAREHOUSE_NOT_FOUND: 'El almacén ya no está activo.',
  FORBIDDEN: 'No tienes permiso para ver esto.',
};

export function alertsErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

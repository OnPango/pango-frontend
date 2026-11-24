import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the alert endpoints. */
const MESSAGES: Record<string, string> = {
  ALERT_NOT_FOUND: 'La alerta no existe o no tienes acceso a su almacén.',
  PRODUCT_NOT_FOUND: 'El producto ya no está activo.',
  WAREHOUSE_NOT_FOUND: 'El almacén ya no está activo.',
  FORBIDDEN: 'No tienes permiso para esto en el almacén de la alerta.',
  ALERT_CLOSED: 'La alerta ya se resolvió: el disponible volvió a superar el punto de reorden.',
};

export function alertsErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

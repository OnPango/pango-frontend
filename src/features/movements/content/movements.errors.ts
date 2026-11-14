import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the movement history. */
const MESSAGES: Record<string, string> = {
  MOVEMENT_NOT_FOUND: 'El movimiento no existe o no tienes acceso a su almacén.',
  FORBIDDEN: 'No tienes permiso para ver los movimientos.',
};

export function movementsErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

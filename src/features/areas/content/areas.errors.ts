import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the department endpoints. */
const MESSAGES: Record<string, string> = {
  DEPARTMENT_NAME_TAKEN: 'Ya existe un área con ese nombre.',
  DEPARTMENT_NOT_FOUND: 'El área ya no existe.',
  FORBIDDEN: 'No tienes permiso para gestionar áreas.',
};

export function areasErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

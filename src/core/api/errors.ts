import { isAxiosError } from 'axios';

/**
 * Error body returned by the backend (and by the mock). NestJS validation errors
 * (`ValidationPipe`) send `message` as an array of strings, one per failed rule.
 */
export interface ApiErrorBody {
  message?: string | string[];
}

/** User-facing message for a failed request. */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Intenta de nuevo.',
): string {
  if (!isAxiosError<ApiErrorBody>(error)) return fallback;
  if (!error.response) return 'No se pudo conectar con el servidor.';
  const message = error.response.data?.message;
  if (Array.isArray(message)) return message.join('. ') || fallback;
  return message || fallback;
}

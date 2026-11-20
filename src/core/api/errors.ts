import { isAxiosError } from 'axios';

/**
 * Error body returned by the backend. Domain errors carry a stable `code` (`INVALID_CREDENTIALS`,
 * `SUBDOMAIN_TAKEN`…) the UI branches on; NestJS validation errors (`ValidationPipe`) have no code
 * and send `message` as an array of strings, one per failed rule.
 */
export interface ApiErrorBody {
  statusCode?: number;
  code?: string;
  message?: string | string[];
}

/** Stable error code of a failed request, if the backend sent one. */
export function getApiErrorCode(error: unknown): string | null {
  return isAxiosError<ApiErrorBody>(error) ? (error.response?.data?.code ?? null) : null;
}

/**
 * The API answered and refused (4xx): repeating the request cannot change that. Network failures
 * and 5xx are worth one more try.
 */
export function isClientError(error: unknown): boolean {
  return isAxiosError(error) && !!error.response && error.response.status < 500;
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

import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the data loads. */
const MESSAGES: Record<string, string> = {
  FORBIDDEN: 'No tienes permiso para importar datos.',
  IMPORT_FILE_INVALID: 'No pudimos leer este archivo. Elige un archivo .xlsx o .csv.',
  IMPORT_FILE_TOO_LARGE: 'El archivo pasa de 500.000 filas: divídelo en dos archivos.',
  IMPORT_NOT_FOUND: 'La carga ya no existe. Empieza de nuevo.',
  IMPORT_MAPPING_INCOMPLETE: 'Falta unir un dato obligatorio.',
};

export function importsErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

/** What the file picker accepts. */
export const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'];

export function isAcceptedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the catalog endpoints. */
const MESSAGES: Record<string, string> = {
  SKU_TAKEN: 'Ya existe un producto con ese código.',
  CATEGORY_INVALID: 'La familia elegida no existe o está inactiva.',
  STOCK_UNIT_INVALID: 'La unidad de medida elegida no existe.',
  CATEGORY_NAME_TAKEN: 'Ya existe una familia con ese nombre.',
  CATEGORY_PARENT_INVALID: 'La familia superior no existe o está inactiva.',
  FORBIDDEN: 'No tienes permiso para esta operación.',
};

/** Message for a failed catalog request: the known code's text, else the API's. */
export function productsErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the catalog endpoints. */
const MESSAGES: Record<string, string> = {
  SKU_TAKEN: 'Ya existe un producto con ese código.',
  SKU_LOCKED: 'El código ya no se puede cambiar: el producto tiene movimientos.',
  TRACKS_LOTS_LOCKED:
    'El seguimiento ya no se puede cambiar: el producto tiene movimientos o lotes.',
  PRODUCT_NOT_FOUND: 'El producto ya no existe.',
  CATEGORY_INVALID: 'La familia elegida no existe o está inactiva.',
  STOCK_UNIT_INVALID: 'La unidad de medida elegida no existe.',
  CATEGORY_NAME_TAKEN: 'Ya existe una familia con ese nombre.',
  CATEGORY_PARENT_INVALID: 'La familia superior no existe o está inactiva.',
  CATEGORY_CYCLE: 'Una familia no puede quedar dentro de sí misma ni de una de sus subfamilias.',
  CATEGORY_HAS_ACTIVE_CHILDREN: 'Tiene subfamilias activas: desactívalas primero.',
  CATEGORY_NOT_FOUND: 'La familia ya no existe.',
  FORBIDDEN: 'No tienes permiso para esta operación.',
};

/** Message for a failed catalog request: the known code's text, else the API's. */
export function productsErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

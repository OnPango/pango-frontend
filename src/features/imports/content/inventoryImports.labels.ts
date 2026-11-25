import { isAxiosError } from 'axios';
import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';
import type { InventoryFieldKey } from '../types/inventoryImports.types';
import { INVENTORY_FIELDS } from '../lib/inventoryTemplate';
import type { IssueCopy } from './movementImports.labels';

/**
 * Spanish text for the row issue codes of the inventory import (pango-core
 * `docs/modules/inventary.md`, "Row issues"). The API's English `message` is shown only for a
 * code this table does not know.
 */
export const INVENTORY_ISSUE_COPY: Record<string, IssueCopy> = {
  REQUIRED_FIELD: { label: 'Falta un dato obligatorio', fix: 'Completa la celda vacía.' },
  INVALID_VALUE: {
    label: 'Valor que no se entiende',
    fix: 'Revisa el formato: números con punto decimal y hasta 4 decimales, fechas AAAA-MM-DD, textos no muy largos.',
  },
  STOCK_UNIT_INVALID: {
    label: 'Unidad de medida desconocida',
    fix: 'Usa una de la plantilla: ud, kg, g, l, ml, m, caja o paquete.',
  },
  UNIT_MISMATCH: {
    label: 'Unidad distinta a la del producto',
    fix: 'El producto ya existe en Pango con otra unidad: usa la misma.',
  },
  TRACKING_MISMATCH: {
    label: 'Seguimiento distinto al del producto',
    fix: 'El producto ya existe en Pango con otro seguimiento (Cantidad o Lote): usa el mismo.',
  },
  PRODUCT_INCONSISTENT: {
    label: 'El mismo código con otra unidad o seguimiento',
    fix: 'Todas las filas de un código deben tener la misma unidad y el mismo seguimiento.',
  },
  PRODUCT_INACTIVE: {
    label: 'Producto inactivo',
    fix: 'Actívalo en Pango o quita la fila.',
  },
  CATEGORY_INACTIVE: {
    label: 'Categoría inactiva',
    fix: 'Actívala en Pango o usa otra categoría.',
  },
  WAREHOUSE_INACTIVE: { label: 'Bodega inactiva', fix: 'Actívala en Pango o usa otra bodega.' },
  CATEGORY_AMBIGUOUS: {
    label: 'Varias categorías con ese nombre',
    fix: 'En Pango hay más de una categoría con ese nombre: renombra una de ellas.',
  },
  WAREHOUSE_FORBIDDEN: {
    label: 'Bodega sin permiso',
    fix: 'No tienes permiso de importar en esa bodega. Pide a un administrador que cargue esas filas.',
  },
  WAREHOUSE_CONFLICT: {
    label: 'Bodega que no coincide',
    fix: 'El código y el nombre apuntan a bodegas distintas, o ya existe una bodega con ese código o nombre.',
  },
  WAREHOUSE_CODE_REQUIRED: {
    label: 'Bodega nueva sin código',
    fix: 'Escribe el código de bodega para crearla.',
  },
  NON_STOCK_WAREHOUSE: {
    label: 'Bodega que no guarda existencias',
    fix: 'Esa bodega no maneja existencias: usa saldo 0 u otra bodega.',
  },
  LOCATION_INVALID: {
    label: 'Ubicación desconocida',
    fix: 'Usa una ubicación activa de la bodega, o déjala vacía para la general.',
  },
  LOT_REQUIRED: { label: 'Falta el lote', fix: 'Con seguimiento Lote, escribe el código de lote.' },
  LOT_NOT_ALLOWED: {
    label: 'Lote en un producto sin lotes',
    fix: 'Con seguimiento Cantidad, deja el lote vacío.',
  },
  LOT_DATES_INVALID: {
    label: 'Vencimiento antes de la fabricación',
    fix: 'Corrige las fechas del lote.',
  },
  ALREADY_HAS_STOCK: {
    label: 'Ya tiene existencias o movimientos',
    fix: 'Esta plantilla solo carga saldos iniciales: ese producto ya tiene existencias o movimientos en esa bodega. Quita la fila.',
  },
  ROW_CONFLICT: {
    label: 'Fila repetida con datos distintos',
    fix: 'El mismo producto, bodega, ubicación y lote aparece en otra fila con otros datos: deja solo una.',
  },
  COST_MISSING: {
    label: 'Sin costo unitario',
    fix: 'Se usará el costo promedio actual del producto (0 si es nuevo).',
  },
  PRODUCT_DIFFERS: {
    label: 'El producto ya existe con otros datos',
    fix: 'Se conservan los datos que tiene Pango; la fila solo agrega existencias.',
  },
  PRODUCT_VALUES_DIFFER: {
    label: 'El mismo código con otros datos',
    fix: 'Se usan el nombre, la categoría y la descripción de la primera fila de ese código.',
  },
  LOT_DATES_DIFFER: {
    label: 'El lote ya existe con otras fechas',
    fix: 'Se conservan las fechas que tiene Pango.',
  },
  DUPLICATE_ROW: { label: 'Fila repetida', fix: 'Se cuenta una sola vez.' },
};

export const inventoryIssueLabel = (code: string, fallback?: string) =>
  INVENTORY_ISSUE_COPY[code]?.label ?? fallback ?? code;

const WARNING_CODES = new Set([
  'COST_MISSING',
  'PRODUCT_DIFFERS',
  'PRODUCT_VALUES_DIFFER',
  'LOT_DATES_DIFFER',
  'DUPLICATE_ROW',
]);

export const isWarningCode = (code: string) => WARNING_CODES.has(code);

const FIELD_LABEL = Object.fromEntries(INVENTORY_FIELDS.map((f) => [f.key, f.label])) as Record<
  InventoryFieldKey,
  string
>;

export const fieldLabel = (key: string) => FIELD_LABEL[key as InventoryFieldKey] ?? key;

/** Spanish text for the error codes of `/inventory-imports`. */
const ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: 'No tienes permiso para importar inventario.',
  IMPORT_NOT_FOUND: 'La carga ya no existe. Empieza de nuevo.',
  IMPORT_NOT_YOURS: 'Solo quien empezó la carga puede enviarla, revisarla o confirmarla.',
  IMPORT_ACTIVE_EXISTS:
    'Otra persona de tu empresa tiene una carga de inventario abierta. Espera a que la termine (se cierra sola después de 24 horas sin uso).',
  IMPORT_LIMIT_EXCEEDED: 'El archivo tiene demasiadas filas para una sola carga: divídelo.',
  IMPORT_CLOSED: 'Esta carga ya se cerró. Empieza una nueva.',
  IMPORT_NOT_READY: 'Hay que corregir los errores antes de confirmar.',
  IMPORT_STALE:
    'Algo cambió en Pango desde la revisión (productos, bodegas o existencias). Revisa de nuevo antes de confirmar.',
  IMPORT_BUSY: 'Pango está ocupado en este momento. Intenta de nuevo en unos segundos.',
  IMPORT_INCOMPLETE: 'No llegaron todas las filas. Intenta de nuevo.',
  BATCH_CONFLICT: 'Las filas enviadas no coinciden con las de antes. Empieza la carga de nuevo.',
  IDEMPOTENCY_CONFLICT: 'Esta carga ya se empezó con otros datos. Empieza de nuevo.',
  ROWS_INVALID: 'Algunas filas no tienen el formato que espera Pango.',
  ROWS_EXCEED_TOTAL: 'Se enviaron más filas de las que tiene el archivo. Empieza de nuevo.',
  MAPPING_INVALID: 'Faltan columnas obligatorias por unir.',
  UNSUPPORTED_SCHEMA_VERSION: 'Esta versión de la plantilla ya no se admite. Descarga la nueva.',
};

export function inventoryImportErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  // A body over the API's size limit is refused before it is read: there is no code.
  if (isAxiosError(error) && error.response?.status === 413) {
    return 'El archivo es demasiado grande para enviarlo. Divídelo en varios archivos.';
  }
  return getApiErrorMessage(error, fallback);
}

import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';
import type { IssueSeverity, TemplateColumn } from '../types/movementImports.types';

export interface IssueCopy {
  /** What is wrong, in a few words. */
  label: string;
  /** What to do about it. */
  fix: string;
}

/**
 * Spanish text for the issue codes of a validation (pango-core `ImportIssueDto.code`). The API also
 * sends an English `message`; it is shown only for a code this table does not know.
 */
export const ISSUE_COPY: Record<string, IssueCopy> = {
  REQUIRED: { label: 'Falta un dato obligatorio', fix: 'Completa la celda vacía.' },
  FIELD_TOO_LONG: { label: 'Texto demasiado largo', fix: 'Acorta el valor de la celda.' },
  INVALID_DATE: {
    label: 'Fecha que no se entiende',
    fix: 'Escríbela como AAAA-MM-DD o DD/MM/AAAA.',
  },
  DATE_IN_FUTURE: { label: 'Fecha futura', fix: 'El historial solo admite fechas hasta hoy.' },
  INVALID_NUMBER: {
    label: 'Número que no se entiende',
    fix: 'Usa punto decimal, sin separador de miles y con 4 decimales como máximo.',
  },
  INVALID_QUANTITY: { label: 'Cantidad no válida', fix: 'La cantidad debe ser mayor que cero.' },
  QUANTITY_SIDE: {
    label: 'Cantidad en la columna equivocada',
    fix: 'Las entradas llevan cantidad que entra; las salidas, cantidad que sale. Solo una de las dos.',
  },
  UNKNOWN_MOVEMENT_TYPE: {
    label: 'Tipo de movimiento desconocido',
    fix: 'Usa uno de los tipos de la plantilla: SALE, PURCHASE_RECEIPT, OPENING_BALANCE…',
  },
  MOVEMENT_TYPE_NOT_ALLOWED: {
    label: 'Tipo de movimiento no permitido',
    fix: 'Tus roles no permiten este tipo en esa bodega. Pide a un administrador que cargue esas filas.',
  },
  UNKNOWN_WAREHOUSE: {
    label: 'Bodega desconocida',
    fix: 'Usa el código de una bodega de Pango donde tengas permiso de importar.',
  },
  UNKNOWN_SKU: {
    label: 'Producto desconocido',
    fix: 'Crea el producto en Pango o corrige el SKU. Si es un número, revisa que no se hayan perdido ceros a la izquierda.',
  },
  UNIT_MISMATCH: {
    label: 'Unidad distinta a la del producto',
    fix: 'Deja la unidad vacía o usa la del producto en Pango.',
  },
  UNKNOWN_LOCATION: {
    label: 'Ubicación desconocida',
    fix: 'Usa una ubicación de la bodega, o déjala vacía para la principal.',
  },
  LOT_REQUIRED: { label: 'Falta el lote', fix: 'Este producto maneja lotes: indica el lote.' },
  LOT_NOT_ALLOWED: {
    label: 'Lote en un producto sin lotes',
    fix: 'Deja el lote vacío para este producto.',
  },
  KEY_CONFLICT: {
    label: 'Línea repetida con datos distintos',
    fix: 'Un mismo número de movimiento y línea aparece dos veces con datos distintos: deja solo una.',
  },
  IMPORTED_DIFFERENTLY: {
    label: 'Ya se cargó con otros datos',
    fix: 'Esta línea ya está en el historial con otros datos. Revisa cuál es la correcta.',
  },
  DOCUMENT_INCONSISTENT: {
    label: 'Movimiento con datos que no coinciden',
    fix: 'Todas las líneas de un movimiento deben tener la misma fecha, bodega, tipo y documento.',
  },
  BALANCE_MISMATCH: {
    label: 'El saldo no cuadra',
    fix: 'El saldo indicado no coincide con las entradas y salidas anteriores.',
  },
  LOT_NOT_FOUND: {
    label: 'Lote que no está en Pango',
    fix: 'Se guarda el código del lote; no se crea el lote.',
  },
  DUPLICATE_ROW: { label: 'Fila repetida', fix: 'Se cuenta una sola vez.' },
  ALREADY_IMPORTED: {
    label: 'Ya estaba en el historial',
    fix: 'Se cargó antes con el mismo sistema de origen: se omite.',
  },
  NO_BALANCE: {
    label: 'Sin saldo de partida',
    fix: 'La demanda cuenta, pero el pronóstico no tendrá existencias de ese periodo. Agrega un saldo inicial o el saldo después de cada movimiento.',
  },
};

/** Severity of each code, so the summary can be split before the issues are loaded. */
export const WARNING_CODES = new Set([
  'LOT_NOT_FOUND',
  'DUPLICATE_ROW',
  'ALREADY_IMPORTED',
  'NO_BALANCE',
]);

export const severityOf = (code: string): IssueSeverity =>
  WARNING_CODES.has(code) ? 'WARNING' : 'ERROR';

export const issueLabel = (code: string, fallback?: string) =>
  ISSUE_COPY[code]?.label ?? fallback ?? code;

/** Short Spanish names of the template columns, for the issues table. */
export const COLUMN_LABEL: Record<TemplateColumn, string> = {
  external_movement_id: 'Número del movimiento',
  line_number: 'Línea',
  business_date: 'Fecha',
  warehouse_code: 'Bodega',
  sku: 'SKU',
  stock_unit: 'Unidad',
  movement_type: 'Tipo',
  quantity_in: 'Entra',
  quantity_out: 'Sale',
  balance_after: 'Saldo',
  document_ref: 'Documento',
  location_code: 'Ubicación',
  lot_code: 'Lote',
  unit_cost: 'Costo unitario',
};

/** Spanish text for the error codes of the import endpoints. */
const ERROR_MESSAGES: Record<string, string> = {
  FORBIDDEN: 'No tienes permiso para importar movimientos.',
  IMPORT_NOT_FOUND: 'La carga ya no existe. Empieza de nuevo.',
  IMPORT_NOT_YOURS: 'Solo quien empezó la carga puede enviarla, validarla o confirmarla.',
  IMPORT_CONFIRMED: 'Esta carga ya se confirmó. Empieza una nueva.',
  ROWS_INVALID: 'Algunas filas no tienen el formato de la plantilla.',
  TOO_MANY_ROWS: 'Una carga admite hasta 200.000 filas: divide el archivo.',
  IMPORT_EMPTY: 'El archivo no tiene filas para cargar.',
  IMPORT_NOT_VALIDATED: 'Hay que revisar el archivo antes de confirmar.',
  IMPORT_STALE:
    'El historial cambió desde la revisión (otra carga guardó algunas de estas líneas). Revísalo de nuevo antes de confirmar.',
  IMPORT_NOTHING_VALID: 'No hay ninguna fila válida para guardar.',
};

export function movementImportErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && ERROR_MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

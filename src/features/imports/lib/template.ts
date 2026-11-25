import type { ImportKind } from '../types/imports.types';
import { TEMPLATE_COLUMNS } from '../types/movementImports.types';

/**
 * Headers of the templates. Movements: the v1 template of pango-core
 * (`docs/templates/pango-standard-kardex-movement-history-import-v1.csv`).
 */
const HEADERS: Record<ImportKind, string[]> = {
  inventory: [
    'Código producto',
    'Producto',
    'Categoría',
    'Unidad de medida',
    'Bodega',
    'Seguimiento',
    'Saldo inicial',
    'Código de lote',
    'Costo unitario',
  ],
  movements: [...TEMPLATE_COLUMNS],
};

const FILE_NAME: Record<ImportKind, string> = {
  inventory: 'Plantilla_Inventario_PANGO.csv',
  movements: 'Plantilla_Movimientos_PANGO.csv',
};

/** Downloads the template of a load as a CSV with only its headers. */
export function downloadTemplate(kind: ImportKind): void {
  // The BOM makes Excel read the accents as UTF-8.
  const blob = new Blob([`\uFEFF${HEADERS[kind].join(',')}\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = FILE_NAME[kind];
  link.click();
  URL.revokeObjectURL(url);
}

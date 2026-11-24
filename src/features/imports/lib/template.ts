import type { ImportKind } from '../types/imports.types';

/** Headers of the templates. Keep them in sync with what the backend joins by name. */
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
  movements: ['Producto', 'Fecha', 'Tipo', 'Cantidad', 'Almacén'],
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

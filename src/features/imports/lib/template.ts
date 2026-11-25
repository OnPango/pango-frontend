import type { ImportKind } from '../types/imports.types';
import { TEMPLATE_COLUMNS } from '../types/movementImports.types';
import { INVENTORY_TEMPLATE_FILE_NAME, INVENTORY_TEMPLATE_URL } from './inventoryTemplate';

function download(href: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
}

/**
 * Downloads the template of a load. Inventory: the published workbook (`public/templates/`), with
 * its instructions sheet. Movements: the v1 headers of pango-core
 * (`docs/templates/pango-standard-kardex-movement-history-import-v1.csv`) as a CSV.
 */
export function downloadTemplate(kind: ImportKind): void {
  if (kind === 'inventory') {
    download(INVENTORY_TEMPLATE_URL, INVENTORY_TEMPLATE_FILE_NAME);
    return;
  }
  // The BOM makes Excel read the accents as UTF-8.
  const blob = new Blob([`\uFEFF${TEMPLATE_COLUMNS.join(',')}\n`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  download(url, 'Plantilla_Movimientos_PANGO.csv');
  URL.revokeObjectURL(url);
}

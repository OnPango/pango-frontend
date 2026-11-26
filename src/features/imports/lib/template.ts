import type { ImportKind } from '../types/imports.types';
import { INVENTORY_TEMPLATE_FILE_NAME, INVENTORY_TEMPLATE_URL } from './inventoryTemplate';
import { MOVEMENT_TEMPLATE_FILE_NAME, MOVEMENT_TEMPLATE_URL } from './movementTemplate';

function download(href: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.click();
}

/**
 * Downloads the template of a load: the published workbook (`public/templates/`), whose first
 * sheet holds the instructions and an example, and the second the columns to fill.
 */
export function downloadTemplate(kind: ImportKind): void {
  if (kind === 'inventory') download(INVENTORY_TEMPLATE_URL, INVENTORY_TEMPLATE_FILE_NAME);
  else download(MOVEMENT_TEMPLATE_URL, MOVEMENT_TEMPLATE_FILE_NAME);
}

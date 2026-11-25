import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useInventoryImportFields } from '../api/inventoryImports.queries';
import {
  buildInventoryRows,
  INVENTORY_FIELDS,
  missingInventoryFields,
} from '../lib/inventoryTemplate';
import { headersOf, normalizeHeader } from '../lib/spreadsheet';
import { useInventoryImportStore } from './inventoryImport.store';
import { useImportOwner } from './useMovementImportWizard';

export type { InventoryWizardStep } from './inventoryImport.store';

/**
 * The inventory import in progress (`inventoryImport.store.ts`) and what the screens derive from
 * it. The state outlives the screen: leaving Importar datos does not lose it.
 */
export function useInventoryImportWizard() {
  const state = useInventoryImportStore(useShallow((s) => s));
  const owner = useImportOwner();
  const { claim } = state;
  const { data: fields } = useInventoryImportFields();

  useEffect(() => {
    if (owner) claim(owner);
  }, [claim, owner]);

  const sheet = useMemo(
    () => state.spreadsheet?.sheets.find((s) => s.name === state.sheetName) ?? null,
    [state.spreadsheet, state.sheetName],
  );
  const headers = useMemo(() => (sheet ? headersOf(sheet) : []), [sheet]);
  const rowCount = useMemo(
    () => (sheet && state.mapping ? buildInventoryRows(sheet, state.mapping).length : 0),
    [sheet, state.mapping],
  );
  const missing = useMemo(
    () => (state.mapping ? missingInventoryFields(state.mapping) : []),
    [state.mapping],
  );
  // Every column of the template is in the file, under its own name.
  const isTemplate = useMemo(() => {
    const names = new Set(headers.map(normalizeHeader));
    return INVENTORY_FIELDS.every((f) => names.has(normalizeHeader(f.label)));
  }, [headers]);
  const maxRows = fields?.limits.maxRowsPerImport ?? null;

  return {
    ...state,
    sheet,
    headers,
    isTemplate,
    missing,
    rowCount,
    maxRows,
    tooManyRows: maxRows !== null && rowCount > maxRows,
  };
}

export type InventoryImportWizardState = ReturnType<typeof useInventoryImportWizard>;

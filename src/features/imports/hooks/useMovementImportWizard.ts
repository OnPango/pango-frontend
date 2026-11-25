import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/core/auth/auth.store';
import {
  buildRows,
  isTemplateFile,
  missingFields,
  quantityMissing,
  SOURCE_NAMESPACE_PATTERN,
} from '../lib/movementTemplate';
import { headersOf } from '../lib/spreadsheet';
import { IMPORT_LIMITS } from '../types/movementImports.types';
import { useMovementImportStore } from './movementImport.store';

export type { MovementWizardStep } from './movementImport.store';

/** `<organization>:<user>` of the session, so an import never carries over to another one. */
export function useImportOwner(): string | null {
  return useAuthStore((state) =>
    state.user ? `${state.user.organization.id}:${state.user.id}` : null,
  );
}

/**
 * The movement history import in progress (`movementImport.store.ts`) and what the screens derive
 * from it. The state outlives the screen: leaving Importar datos does not lose it.
 */
export function useMovementImportWizard() {
  const state = useMovementImportStore(useShallow((s) => s));
  const owner = useImportOwner();
  const { claim } = state;

  useEffect(() => {
    if (owner) claim(owner);
  }, [claim, owner]);

  const sheet = useMemo(
    () => state.spreadsheet?.sheets.find((s) => s.name === state.sheetName) ?? null,
    [state.spreadsheet, state.sheetName],
  );
  const headers = useMemo(() => (sheet ? headersOf(sheet) : []), [sheet]);
  const rowCount = useMemo(
    () => (sheet && state.mapping ? buildRows(sheet, state.mapping).length : 0),
    [sheet, state.mapping],
  );
  const missing = useMemo(
    () => (state.mapping ? missingFields(state.mapping) : []),
    [state.mapping],
  );

  return {
    ...state,
    sheet,
    headers,
    isTemplate: isTemplateFile(headers),
    namespaceValid: SOURCE_NAMESPACE_PATTERN.test(state.sourceNamespace),
    missing,
    noQuantity: state.mapping ? quantityMissing(state.mapping) : true,
    rowCount,
    tooManyRows: rowCount > IMPORT_LIMITS.maxRows,
  };
}

export type MovementImportWizardState = ReturnType<typeof useMovementImportWizard>;

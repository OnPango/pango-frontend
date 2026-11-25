import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { IssuesQuery, PreviewRowsQuery } from '../types/inventoryImports.types';
import {
  getInventoryImportFields,
  getInventoryImportIssues,
  getInventoryImportRows,
} from './inventoryImports.api';

export const inventoryImportsKeys = {
  all: ['inventory-imports'] as const,
  fields: () => [...inventoryImportsKeys.all, 'fields'] as const,
  issues: (id: number, revision: number, query: IssuesQuery) =>
    [...inventoryImportsKeys.all, id, revision, 'issues', query] as const,
  rows: (id: number, revision: number, query: PreviewRowsQuery) =>
    [...inventoryImportsKeys.all, id, revision, 'rows', query] as const,
};

/** The field dictionary and limits; they only change when the API is reconfigured. */
export function useInventoryImportFields() {
  return useQuery({
    queryKey: inventoryImportsKeys.fields(),
    queryFn: getInventoryImportFields,
    staleTime: Infinity,
  });
}

/** A page of the issues of the validation `revision` of an import. */
export function useInventoryImportIssues(id: number, revision: number, query: IssuesQuery) {
  return useQuery({
    queryKey: inventoryImportsKeys.issues(id, revision, query),
    queryFn: () => getInventoryImportIssues(id, query),
    placeholderData: keepPreviousData,
  });
}

/** A page of the preview rows of the validation `revision` of an import. */
export function useInventoryImportRows(id: number, revision: number, query: PreviewRowsQuery) {
  return useQuery({
    queryKey: inventoryImportsKeys.rows(id, revision, query),
    queryFn: () => getInventoryImportRows(id, query),
    placeholderData: keepPreviousData,
  });
}

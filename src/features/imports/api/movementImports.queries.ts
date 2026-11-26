import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { IssuesQuery } from '../types/movementImports.types';
import { getMovementImportBalances, getMovementImportReport } from './movementImports.api';

export const movementImportsKeys = {
  all: ['movement-imports'] as const,
  issues: (id: number, revision: number, query: IssuesQuery) =>
    [...movementImportsKeys.all, id, revision, 'issues', query] as const,
  balances: (id: number, revision: number, page: number) =>
    [...movementImportsKeys.all, id, revision, 'balances', page] as const,
};

/** A page of the issues of the validation `revision` of an import. */
export function useMovementImportIssues(id: number, revision: number, query: IssuesQuery) {
  return useQuery({
    queryKey: movementImportsKeys.issues(id, revision, query),
    queryFn: () => getMovementImportReport(id, query),
    select: (report) => report.issues,
    placeholderData: keepPreviousData,
  });
}

/** A page of the per product and warehouse balances of the validation `revision` of an import. */
export function useMovementImportBalances(
  id: number,
  revision: number,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: movementImportsKeys.balances(id, revision, page),
    queryFn: () => getMovementImportBalances(id, { page, pageSize }),
    placeholderData: keepPreviousData,
  });
}

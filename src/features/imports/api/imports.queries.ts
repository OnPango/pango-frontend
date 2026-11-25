import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImportKind, PreviewFilter } from '../types/imports.types';
import {
  analyzeFile,
  confirmImport,
  getImportRun,
  getImports,
  getQuality,
  previewImport,
} from './imports.api';

export const importsKeys = {
  all: ['imports'] as const,
  list: () => [...importsKeys.all, 'list'] as const,
  run: (id: string) => [...importsKeys.all, 'run', id] as const,
  quality: () => [...importsKeys.all, 'quality'] as const,
};

export function useImports(enabled = true) {
  return useQuery({ queryKey: importsKeys.list(), queryFn: getImports, enabled });
}

export function useQuality() {
  return useQuery({ queryKey: importsKeys.quality(), queryFn: getQuality });
}

export function useAnalyzeFile() {
  return useMutation({
    mutationFn: ({ kind, file }: { kind: ImportKind; file: File }) => analyzeFile(kind, file),
  });
}

export function usePreviewImport() {
  return useMutation({
    mutationFn: (args: {
      uploadId: string;
      mapping: Record<string, string | null>;
      filter: PreviewFilter;
    }) => previewImport(args.uploadId, args.mapping, args.filter),
  });
}

export function useConfirmImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uploadId,
      input,
    }: {
      uploadId: string;
      input: Parameters<typeof confirmImport>[1];
    }) => confirmImport(uploadId, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: importsKeys.all }),
  });
}

/** Polls a load while it runs; stops once it is done or failed. */
export function useImportRun(id: string | null) {
  return useQuery({
    queryKey: importsKeys.run(id ?? 'none'),
    queryFn: () => getImportRun(id as string),
    enabled: id !== null,
    refetchInterval: (query) => (query.state.data?.state === 'PROCESSING' ? 1000 : false),
  });
}

import { http } from '@/core/api/http';
import type {
  ConfirmInput,
  ImportAnalysis,
  ImportKind,
  ImportPreview,
  ImportRecord,
  ImportRun,
  PreviewFilter,
  QualitySummary,
} from '../types/imports.types';
import type { AnalyzeBodyDto, ConfirmBodyDto, PreviewBodyDto } from './imports.dto';

/** `GET /imports`: previous loads, most recent first. */
export async function getImports(): Promise<ImportRecord[]> {
  const { data } = await http.get<ImportRecord[]>('/imports');
  return data;
}

/** `POST /imports/analyze`: reads the file, finds its columns and proposes how to join them. */
export async function analyzeFile(kind: ImportKind, file: File): Promise<ImportAnalysis> {
  const body: AnalyzeBodyDto = { kind, fileName: file.name, sizeBytes: file.size };
  const { data } = await http.post<ImportAnalysis>('/imports/analyze', body);
  return data;
}

/** `POST /imports/:id/preview`: what the load would do with this column mapping. Nothing is saved. */
export async function previewImport(
  uploadId: string,
  mapping: Record<string, string | null>,
  filter: PreviewFilter,
): Promise<ImportPreview> {
  const body: PreviewBodyDto = { mapping, filter };
  const { data } = await http.post<ImportPreview>(`/imports/${uploadId}/preview`, body);
  return data;
}

/** `POST /imports/:id/confirm`: starts the load. It keeps running if the user leaves the page. */
export async function confirmImport(uploadId: string, input: ConfirmInput): Promise<ImportRun> {
  const body: ConfirmBodyDto = input;
  const { data } = await http.post<ImportRun>(`/imports/${uploadId}/confirm`, body);
  return data;
}

/** `GET /imports/:id`: progress and, once finished, the result of a load. */
export async function getImportRun(id: string): Promise<ImportRun> {
  const { data } = await http.get<ImportRun>(`/imports/${id}`);
  return data;
}

/** `GET /imports/quality`: how much history each product has and how reliable its forecast is. */
export async function getQuality(): Promise<QualitySummary> {
  const { data } = await http.get<QualitySummary>('/imports/quality');
  return data;
}

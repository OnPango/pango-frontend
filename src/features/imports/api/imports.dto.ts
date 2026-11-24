/**
 * Bodies of the data-load endpoints. The contract is still to be agreed with pango-core: until
 * then the mock backend (`src/mocks/handlers/imports.handlers.ts`) is the reference.
 */

import type { ImportKind, PreviewFilter, Resolution } from '../types/imports.types';

/** `POST /imports/analyze`: the file is read by the backend; the mock only gets its description. */
export interface AnalyzeBodyDto {
  kind: ImportKind;
  fileName: string;
  sizeBytes: number;
}

/** `POST /imports/:id/preview`: which column of the file carries each datum (`null` = none). */
export interface PreviewBodyDto {
  mapping: Record<string, string | null>;
  filter: PreviewFilter;
}

/** `POST /imports/:id/confirm`. */
export interface ConfirmBodyDto {
  resolutions: Record<string, Resolution>;
  requireApproval: boolean;
}

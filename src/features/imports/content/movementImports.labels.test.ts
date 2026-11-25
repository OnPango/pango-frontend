import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { ISSUE_COPY, movementImportErrorMessage, severityOf } from './movementImports.labels';

const apiError = (status: number, body: object) =>
  new AxiosError('failed', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: body,
  });

/** Every issue code of pango-core's validation (`ImportIssueDto.code`). */
const API_ERRORS = [
  'REQUIRED',
  'FIELD_TOO_LONG',
  'INVALID_DATE',
  'DATE_IN_FUTURE',
  'INVALID_NUMBER',
  'INVALID_QUANTITY',
  'QUANTITY_SIDE',
  'UNKNOWN_MOVEMENT_TYPE',
  'MOVEMENT_TYPE_NOT_ALLOWED',
  'UNKNOWN_WAREHOUSE',
  'UNKNOWN_SKU',
  'UNIT_MISMATCH',
  'UNKNOWN_LOCATION',
  'LOT_REQUIRED',
  'LOT_NOT_ALLOWED',
  'KEY_CONFLICT',
  'IMPORTED_DIFFERENTLY',
  'DOCUMENT_INCONSISTENT',
  'BALANCE_MISMATCH',
];
const API_WARNINGS = ['LOT_NOT_FOUND', 'DUPLICATE_ROW', 'ALREADY_IMPORTED', 'NO_BALANCE'];

describe('issue copy', () => {
  it('has Spanish text for every issue code of the API', () => {
    for (const code of [...API_ERRORS, ...API_WARNINGS]) {
      expect(ISSUE_COPY[code], code).toBeDefined();
    }
  });

  it('knows which codes are warnings', () => {
    expect(API_ERRORS.map(severityOf).every((s) => s === 'ERROR')).toBe(true);
    expect(API_WARNINGS.map(severityOf).every((s) => s === 'WARNING')).toBe(true);
  });
});

describe('movementImportErrorMessage', () => {
  it('translates the stable error codes', () => {
    const stale = apiError(409, { statusCode: 409, code: 'IMPORT_STALE', message: 'changed' });
    expect(movementImportErrorMessage(stale, 'x')).toMatch(/Revísalo de nuevo/);
  });

  it('falls back to the API message, then to the given text', () => {
    const validation = apiError(400, { statusCode: 400, message: ['sourceNamespace must match'] });
    expect(movementImportErrorMessage(validation, 'x')).toBe('sourceNamespace must match');
    expect(movementImportErrorMessage(new Error('boom'), 'No pudimos.')).toBe('No pudimos.');
  });
});

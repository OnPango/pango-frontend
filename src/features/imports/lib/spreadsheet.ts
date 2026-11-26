/** A cell as read from the file: CSV cells are text; Excel cells keep their type. */
export type Cell = string | number | boolean | Date | null;

/** One sheet of the file: its first row is the header. */
export interface SheetData {
  name: string;
  rows: Cell[][];
}

export interface Spreadsheet {
  fileName: string;
  sizeBytes: number;
  sheets: SheetData[];
}

export class SpreadsheetError extends Error {}

/** What the file picker accepts. */
export const ACCEPTED_EXTENSIONS = ['.xlsx', '.csv'] as const;

export function isAcceptedFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/**
 * The separator of a CSV: the one of `,` `;` and tab that appears most in the first line outside
 * quotes. Spanish-locale Excel saves CSV with `;`.
 */
export function detectDelimiter(text: string): string {
  const counts = new Map<string, number>([
    [',', 0],
    [';', 0],
    ['\t', 0],
  ]);
  let quoted = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === '\n' || char === '\r')) break;
    else if (!quoted && counts.has(char)) counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let best = ',';
  for (const [delimiter, count] of counts) {
    if (count > (counts.get(best) ?? 0)) best = delimiter;
  }
  return best;
}

/**
 * Parses CSV text (RFC 4180: quoted fields, `""` escapes, line breaks inside quotes, CRLF or LF).
 * A leading BOM is dropped. Trailing empty lines are not rows.
 */
export function parseCsv(input: string, delimiter = detectDelimiter(input)): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length > 0 && isEmptyRow(rows[rows.length - 1])) rows.pop();
  return rows;
}

export function isEmptyRow(row: readonly Cell[]): boolean {
  return row.every((cell) => cell === null || (typeof cell === 'string' && cell.trim() === ''));
}

/** Header texts of a sheet; an empty header is named after its column letter. */
export function headersOf(sheet: SheetData): string[] {
  const first = sheet.rows[0] ?? [];
  const width = Math.max(0, ...sheet.rows.slice(0, 50).map((row) => row.length));
  return Array.from({ length: width }, (_, index) => {
    const cell = first[index];
    const text = cell === null || cell === undefined ? '' : String(cell).trim();
    return text || `Columna ${columnLetter(index)}`;
  });
}

/** `0` → `A`, `25` → `Z`, `26` → `AA`. */
export function columnLetter(index: number): string {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const rest = (n - 1) % 26;
    letter = String.fromCharCode(65 + rest) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

/** Data rows of a sheet (without the header) that hold something. */
export function dataRowCount(sheet: SheetData): number {
  return sheet.rows.slice(1).filter((row) => !isEmptyRow(row)).length;
}

/** `Código de Bodega ` → `codigo_de_bodega`: lower case, no accents, words joined by `_`. */
export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const pad = (n: number) => String(n).padStart(2, '0');

/** A date as `YYYY-MM-DD`, from its UTC parts (Excel dates carry no time zone). */
export function isoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Excel serial day (days since 1899-12-30) to a date. */
export function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86_400_000));
}

/** A date written as text, in the template format when it is recognized. */
export function normalizeDateText(text: string): string {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/.exec(text);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s.*)?$/.exec(text);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  return text;
}

/** A number without the float noise Excel can leave (`0.30000000000000004` → `0.3`). */
export function numberText(value: number): string {
  return String(Number(value.toPrecision(15)));
}

/** Reads a .csv or .xlsx in the browser. Nothing leaves the device here. */
export async function readSpreadsheet(file: File): Promise<Spreadsheet> {
  const lower = file.name.toLowerCase();
  let sheets: SheetData[];
  if (lower.endsWith('.csv')) {
    const text = await file.text();
    sheets = [{ name: file.name, rows: parseCsv(text) }];
  } else if (lower.endsWith('.xlsx')) {
    // Loaded on demand: the Excel reader is only downloaded by who imports a file.
    const { default: readXlsxFile } = await import('read-excel-file/browser');
    try {
      const all = await readXlsxFile(file);
      sheets = all.map(({ sheet, data }) => ({ name: sheet, rows: data as Cell[][] }));
    } catch {
      throw new SpreadsheetError(
        'No pudimos abrir este Excel. Revisa que no tenga contraseña y que se abra en Excel.',
      );
    }
  } else {
    throw new SpreadsheetError(
      `“${file.name}” no es un Excel ni un CSV. Elige un archivo .xlsx o .csv.`,
    );
  }

  sheets = sheets.filter((sheet) => sheet.rows.length > 0);
  if (sheets.length === 0 || sheets.every((sheet) => dataRowCount(sheet) === 0)) {
    throw new SpreadsheetError(
      'El archivo está vacío o solo tiene encabezados. La primera fila debe tener los nombres de las columnas y las siguientes, los datos.',
    );
  }
  return { fileName: file.name, sizeBytes: file.size, sheets };
}

import type {
  ConflictItem,
  ImportAnalysis,
  ImportKind,
  ImportPreview,
  ImportRecord,
  ImportRun,
  PreviewRow,
  ProcessingStepId,
  QualitySummary,
  RowResult,
} from '@/features/imports/types/imports.types';
import { authorize, error } from '../guard';
import type { MockRoutes } from '../server';

/**
 * Data loads (`/imports`). The contract with pango-core is still to be agreed, so this mock is its
 * reference. It does not read the file: it answers from the file name, which is enough to walk
 * every screen:
 *  - a name with "plantilla" is Pango's template (every column joins by itself);
 *  - any other inventory file lacks the "Saldo inicial" column (the user must pick it);
 *  - a name with "fallo" makes the load fail halfway;
 *  - anything that is not .xlsx or .csv is refused.
 */

interface Upload {
  kind: ImportKind;
  fileName: string;
}

interface Run {
  kind: ImportKind;
  startedAt: number;
  fails: boolean;
  requireApproval: boolean;
}

const uploads = new Map<string, Upload>();
const runs = new Map<string, Run>();
let counter = 100;

const history: ImportRecord[] = [
  record(
    'imp-5',
    'movements',
    '2025-10-12',
    'historial_movimientos_2025.xlsx',
    48012,
    198,
    'PARTIAL',
    'Carlos Arango',
  ),
  record(
    'imp-4',
    'inventory',
    '2025-09-30',
    'Plantilla_Inventario_PANGO.xlsx',
    1226,
    14,
    'PARTIAL',
    'Ana Martínez',
  ),
  record(
    'imp-3',
    'movements',
    '2025-06-03',
    'ventas_primer_semestre.csv',
    21400,
    0,
    'COMPLETED',
    'Ana Martínez',
  ),
  record(
    'imp-2',
    'inventory',
    '2025-05-20',
    'inventario_inicial.xlsx',
    1240,
    0,
    'COMPLETED',
    'Carlos Arango',
  ),
  record(
    'imp-1',
    'movements',
    '2025-05-14',
    'movimientos_abril.csv',
    0,
    null,
    'FAILED',
    'Ana Martínez',
  ),
];

function record(
  id: string,
  kind: ImportKind,
  date: string,
  fileName: string,
  rowsLoaded: number,
  rowsSkipped: number | null,
  status: ImportRecord['status'],
  userName: string,
): ImportRecord {
  return { id, kind, date, fileName, rowsLoaded, rowsSkipped, status, userName };
}

const TOTAL_MS = 5000;
const STEP_ORDER: ProcessingStepId[] = ['READ', 'VALIDATED', 'SAVING', 'ALERTS'];

const INVENTORY_HEADERS = [
  'Código producto',
  'Producto',
  'Categoría',
  'Unidad de medida',
  'Bodega',
  'Seguimiento',
  'Cantidad',
  'Observaciones',
  'Código de lote',
  'Costo unitario',
];

function analyze(kind: ImportKind, fileName: string): ImportAnalysis {
  const lower = fileName.toLowerCase();
  const isTemplate = lower.includes('plantilla');
  if (kind === 'movements') {
    return {
      uploadId: '',
      file: {
        name: fileName,
        sizeKb: 2310,
        rows: 48210,
        columns: 5,
        sheets: ['Movimientos'],
        isTemplate,
      },
      headers: ['cod_producto', 'fecha_mov', 'tipo', 'cantidad', 'bodega'],
      fields: [
        {
          key: 'product',
          label: 'Código del producto',
          required: true,
          example: 'PRD-001',
          column: 'cod_producto',
        },
        {
          key: 'date',
          label: 'Fecha del movimiento',
          required: true,
          example: '02/01/2025',
          column: 'fecha_mov',
        },
        {
          key: 'type',
          label: 'Tipo de movimiento',
          required: true,
          example: 'Salida',
          column: 'tipo',
        },
        { key: 'quantity', label: 'Cantidad', required: true, example: '12', column: 'cantidad' },
        {
          key: 'warehouse',
          label: 'Almacén',
          required: true,
          example: 'Bodega principal',
          column: 'bodega',
        },
      ],
      optionalSummary: null,
      optionalCount: 0,
    };
  }
  const col = (name: string) => (INVENTORY_HEADERS.includes(name) ? name : null);
  const balance = isTemplate ? 'Saldo inicial' : null;
  return {
    uploadId: '',
    file: {
      name: fileName,
      sizeKb: 142,
      rows: 1240,
      columns: 21,
      sheets: ['Inventario', 'Instrucciones'],
      isTemplate,
    },
    headers: isTemplate
      ? [...INVENTORY_HEADERS.filter((h) => h !== 'Cantidad'), 'Saldo inicial']
      : INVENTORY_HEADERS,
    fields: [
      {
        key: 'code',
        label: 'Código del producto',
        required: true,
        example: 'TOR-001',
        column: col('Código producto'),
      },
      {
        key: 'name',
        label: 'Nombre del producto',
        required: true,
        example: 'Tornillo',
        column: col('Producto'),
      },
      {
        key: 'category',
        label: 'Categoría',
        required: true,
        example: 'Tornillería',
        column: col('Categoría'),
      },
      {
        key: 'unit',
        label: 'Unidad de medida',
        required: true,
        example: 'ud',
        column: col('Unidad de medida'),
      },
      {
        key: 'warehouse',
        label: 'Bodega',
        required: true,
        example: 'Principal',
        column: col('Bodega'),
      },
      {
        key: 'tracking',
        label: 'Seguimiento',
        required: true,
        example: 'Cantidad',
        column: col('Seguimiento'),
      },
      { key: 'balance', label: 'Saldo', required: true, example: '500', column: balance },
      {
        key: 'lot',
        label: 'Código de lote',
        required: false,
        hint: 'si el seguimiento es Lote',
        example: 'L-001',
        column: col('Código de lote'),
      },
      {
        key: 'cost',
        label: 'Costo unitario',
        required: false,
        hint: 'opcional',
        example: '300',
        column: col('Costo unitario'),
      },
    ],
    optionalSummary:
      'Ubicación, fechas de fabricación y vencimiento, tipo, código y dirección de bodega, descripción, largo, ancho, alto, peso y volumen.',
    optionalCount: 12,
  };
}

const row = (cells: string[], result: RowResult, note = ''): PreviewRow => ({
  cells,
  result,
  note,
});

const INVENTORY_ROWS: PreviewRow[] = [
  row(['Tornillo M8', 'PRD-001', 'Bodega principal', '—', '352', '340', '−12'], 'VALID'),
  row(['Tuerca M8', 'PRD-002', 'Bodega principal', '—', '410', '410', '0'], 'NO_CHANGE'),
  row(
    ['Aceite motor', 'ACE-001', 'Bodega principal', 'L-002', '—', '60', '+60'],
    'NEW',
    'Nuevo lote',
  ),
  row(
    ['Tornillo M8', 'PRD-001', 'Bodega 2', '—', '—', '20', '—'],
    'ERROR',
    'Categoría distinta en otra fila',
  ),
  row(
    ['Caja corrugada 40x30', 'PRD-051', 'Bodega principal', '—', '—', '50', '—'],
    'ERROR',
    'Unidad no reconocida',
  ),
  row(
    ['Cinta de embalar', 'PRD-044', 'Bodega 2', '—', '30', '—', '—'],
    'ERROR',
    'Falta código de lote',
  ),
];

const MOVEMENT_ROWS: PreviewRow[] = [
  row(['02/01/2025', 'PRD-001', 'Salida', '12', 'Bodega principal'], 'VALID'),
  row(['02/01/2025', 'PRD-017', 'Entrada', '60', 'Bodega 2'], 'VALID'),
  row(['03/01/2025', 'PRD-032', 'Salida', '8', 'Bodega 2'], 'VALID'),
  row(['03/01/2025', 'PRD-9999', 'Salida', '5', 'Bodega principal'], 'ERROR', 'Producto no existe'),
  row(['04/01/2025', 'PRD-002', 'Salida', '−3', 'Bodega principal'], 'ERROR', 'Cantidad inválida'),
  row(['04/01/2025', 'PRD-044', 'Entrada', '120', 'Bodega principal'], 'VALID'),
];

const CONFLICTS: ConflictItem[] = [
  {
    id: 'c1',
    subject: 'PRODUCT',
    name: 'Tornillo M8',
    code: 'PRD-001',
    field: 'Nombre',
    inPango: 'Tornillo M8',
    inFile: 'Tornillo M8 galvanizado',
    locked: false,
  },
  {
    id: 'c2',
    subject: 'PRODUCT',
    name: 'Tornillo M8',
    code: 'PRD-001',
    field: 'Costo unitario',
    inPango: '$ 280',
    inFile: '$ 300',
    locked: false,
  },
  {
    id: 'c3',
    subject: 'PRODUCT',
    name: 'Aceite motor',
    code: 'ACE-001',
    field: 'Categoría',
    inPango: 'Lubricantes',
    inFile: 'Aceites',
    locked: false,
  },
  {
    id: 'c4',
    subject: 'PRODUCT',
    name: 'Aceite motor',
    code: 'ACE-001',
    field: 'Descripción',
    inPango: '—',
    inFile: 'Aceite 20W-50 para motor',
    locked: false,
  },
  {
    id: 'c5',
    subject: 'PRODUCT',
    name: 'Aceite motor',
    code: 'ACE-001',
    field: 'Unidad de medida',
    inPango: 'L',
    inFile: 'mL',
    locked: true,
  },
  {
    id: 'c6',
    subject: 'WAREHOUSE',
    name: 'Bodega',
    code: 'Principal',
    field: 'Dirección',
    inPango: 'Cra 45 #12-30',
    inFile: 'Calle 80 #20-15',
    locked: false,
  },
];

function filterRows(rows: PreviewRow[], filter: string): PreviewRow[] {
  switch (filter) {
    case 'valid':
      return rows.filter(
        (r) => r.result === 'VALID' || r.result === 'NO_CHANGE' || r.result === 'NEW',
      );
    case 'changed':
      return rows.filter((r) => r.result === 'VALID' || r.result === 'NEW');
    case 'new':
      return rows.filter((r) => r.result === 'NEW');
    case 'errors':
      return rows.filter((r) => r.result === 'ERROR');
    case 'different':
      return rows.filter((r) => r.result === 'NO_CHANGE');
    default:
      return rows;
  }
}

function buildPreview(kind: ImportKind, filter: string): ImportPreview {
  if (kind === 'movements') {
    return {
      validRows: 48012,
      errorRows: 198,
      columns: [
        { key: 'date', label: 'Fecha' },
        { key: 'product', label: 'Producto' },
        { key: 'type', label: 'Tipo' },
        { key: 'quantity', label: 'Cantidad', numeric: true },
        { key: 'warehouse', label: 'Almacén' },
      ],
      rows: filterRows(MOVEMENT_ROWS, filter),
      shownRows: MOVEMENT_ROWS.length,
      totalRows: 48210,
      stockChanges: null,
      creations: null,
      conflictRecords: 0,
      conflictFields: 0,
      conflicts: [],
      products: 126,
      period: 'enero a diciembre de 2025',
      adjustments: null,
      warehouses: null,
      errorReasons: [
        {
          reason: 'Producto no existe',
          rows: 120,
          fix: 'Usa el código de un producto que ya esté en Pango',
        },
        { reason: 'Cantidad inválida', rows: 78, fix: 'Usa un número positivo' },
      ],
    };
  }
  return {
    validRows: 1226,
    errorRows: 14,
    columns: [
      { key: 'product', label: 'Producto' },
      { key: 'warehouse', label: 'Bodega' },
      { key: 'lot', label: 'Lote' },
      { key: 'inPango', label: 'En Pango hoy', numeric: true },
      { key: 'inFile', label: 'En tu archivo', numeric: true },
      { key: 'diff', label: 'Diferencia', numeric: true },
    ],
    rows: filterRows(INVENTORY_ROWS, filter),
    shownRows: INVENTORY_ROWS.length,
    totalRows: 1240,
    stockChanges: 214,
    creations: { products: 18, categories: 2, warehouses: 1, lots: 12 },
    conflictRecords: 24,
    conflictFields: 37,
    conflicts: CONFLICTS,
    products: 412,
    period: null,
    adjustments: { up: 118, down: 96, large: 9 },
    warehouses: 3,
    errorReasons: [
      { reason: 'Unidad no reconocida', rows: 6, fix: 'Usa ud, kg, g, L, mL, m, caja o paquete' },
      { reason: 'Falta código de lote', rows: 4, fix: 'Escríbelo si el seguimiento es Lote' },
      {
        reason: 'Datos distintos para el mismo producto',
        rows: 3,
        fix: 'Deja igual nombre, categoría y unidad en todas sus filas',
      },
      { reason: 'Saldo vacío o inválido', rows: 1, fix: 'Usa 0 o un número positivo' },
    ],
  };
}

function toRun(id: string, run: Run): ImportRun {
  const elapsed = Date.now() - run.startedAt;
  const raw = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));
  const progress = run.fails ? Math.min(raw, 60) : raw;
  const doneCount = Math.min(STEP_ORDER.length, Math.floor(progress / 25));
  const doneSteps = STEP_ORDER.slice(0, run.fails ? Math.min(doneCount, 2) : doneCount);
  if (run.fails && raw >= 60) {
    return { id, state: 'FAILED', progress, doneSteps, summary: null };
  }
  if (raw < 100) return { id, state: 'PROCESSING', progress, doneSteps, summary: null };
  const inventory = run.kind === 'inventory';
  const pending = inventory && run.requireApproval ? 9 : 0;
  return {
    id,
    state: 'PARTIAL',
    progress: 100,
    doneSteps: STEP_ORDER,
    summary: inventory
      ? {
          rowsLoaded: 1226,
          rowsSkipped: 14,
          products: 412,
          newProducts: 18,
          adjustments: 214 - pending,
          pendingApproval: pending,
          movements: 0,
        }
      : {
          rowsLoaded: 48012,
          rowsSkipped: 198,
          products: 126,
          newProducts: 0,
          adjustments: 0,
          pendingApproval: 0,
          movements: 48012,
        },
  };
}

const QUALITY: QualitySummary = {
  good: 98,
  regular: 19,
  low: 9,
  rows: [
    {
      productId: '1',
      name: 'Tornillo M8',
      code: 'PRD-001',
      monthsWithData: 12,
      gaps: 0,
      quality: 'GOOD',
    },
    {
      productId: '2',
      name: 'Tuerca M8',
      code: 'PRD-002',
      monthsWithData: 12,
      gaps: 1,
      quality: 'GOOD',
    },
    {
      productId: '32',
      name: 'Cable USB',
      code: 'PRD-032',
      monthsWithData: 9,
      gaps: 3,
      quality: 'REGULAR',
    },
    {
      productId: '51',
      name: 'Caja corrugada 40x30',
      code: 'PRD-051',
      monthsWithData: 4,
      gaps: 8,
      quality: 'LOW',
    },
  ],
};

export const importsRoutes: MockRoutes = {
  'GET /imports': () => {
    const auth = authorize('settings.manage');
    if (auth.error) return auth.error;
    return { status: 200, data: history };
  },

  'GET /imports/quality': () => {
    const auth = authorize('settings.manage', 'forecast.read');
    if (auth.error) return auth.error;
    return { status: 200, data: QUALITY };
  },

  'POST /imports/analyze': ({ body }) => {
    const auth = authorize('settings.manage');
    if (auth.error) return auth.error;
    const input = (body ?? {}) as { kind?: ImportKind; fileName?: string };
    const name = input.fileName ?? '';
    if (input.kind !== 'inventory' && input.kind !== 'movements') {
      return error(400, 'VALIDATION', 'kind must be inventory or movements');
    }
    if (!/\.(xlsx|csv)$/i.test(name)) {
      return error(422, 'IMPORT_FILE_INVALID', `"${name}" is not an Excel or CSV file`);
    }
    const analysis = analyze(input.kind, name);
    counter += 1;
    const uploadId = `up-${counter}`;
    uploads.set(uploadId, { kind: input.kind, fileName: name });
    return { status: 200, data: { ...analysis, uploadId } };
  },

  'POST /imports/:id/preview': ({ params, body }) => {
    const auth = authorize('settings.manage');
    if (auth.error) return auth.error;
    const upload = uploads.get(params.id);
    if (!upload) return error(404, 'IMPORT_NOT_FOUND', 'Upload not found');
    const input = (body ?? {}) as { mapping?: Record<string, string | null>; filter?: string };
    const fields = analyze(upload.kind, upload.fileName).fields;
    const mapping = input.mapping ?? {};
    if (fields.some((field) => field.required && !mapping[field.key])) {
      return error(400, 'IMPORT_MAPPING_INCOMPLETE', 'A required column is not mapped');
    }
    return { status: 200, data: buildPreview(upload.kind, input.filter ?? 'all') };
  },

  'POST /imports/:id/confirm': ({ params, body }) => {
    const auth = authorize('settings.manage');
    if (auth.error) return auth.error;
    const upload = uploads.get(params.id);
    if (!upload) return error(404, 'IMPORT_NOT_FOUND', 'Upload not found');
    const input = (body ?? {}) as { requireApproval?: boolean };
    const run: Run = {
      kind: upload.kind,
      startedAt: Date.now(),
      fails: upload.fileName.toLowerCase().includes('fallo'),
      requireApproval: input.requireApproval === true,
    };
    runs.set(params.id, run);
    const inventory = upload.kind === 'inventory';
    history.unshift(
      record(
        `imp-${params.id}`,
        upload.kind,
        new Date().toISOString().slice(0, 10),
        upload.fileName,
        run.fails ? 0 : inventory ? 1226 : 48012,
        run.fails ? null : inventory ? 14 : 198,
        run.fails ? 'FAILED' : 'PARTIAL',
        auth.user.full_name ?? 'Tú',
      ),
    );
    return { status: 202, data: toRun(params.id, run) };
  },

  'GET /imports/:id': ({ params }) => {
    const auth = authorize('settings.manage');
    if (auth.error) return auth.error;
    const run = runs.get(params.id);
    if (!run) return error(404, 'IMPORT_NOT_FOUND', 'Import not found');
    return { status: 200, data: toRun(params.id, run) };
  },
};

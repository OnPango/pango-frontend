import type {
  DataQuality,
  ImportKind,
  ImportStatus,
  ProcessingStepId,
  RowResult,
} from '../types/imports.types';

export interface KindCopy {
  title: string;
  /** Subtitle of the wizard header. */
  tagline: string;
  /** Card text on the start screen. */
  description: string;
  needs: string[];
  usage: string;
  template: string;
  templateFile: string;
  cta: string;
  fileTitle: string;
}

export const KIND_COPY: Record<ImportKind, KindCopy> = {
  inventory: {
    title: 'Inventario',
    tagline: 'Tu punto de partida en Pango',
    description:
      'Lo que tienes hoy en cada bodega, como saldo inicial. Pango crea los productos, categorías, bodegas y lotes que falten.',
    needs: [
      'Código producto',
      'Producto',
      'Categoría',
      'Unidad',
      'Bodega',
      'Seguimiento',
      'Saldo inicial',
    ],
    usage:
      'Úsalo una vez, al empezar con Pango. Lo que ya tiene existencias o movimientos no se vuelve a cargar. Usa la plantilla de inventario de Pango.',
    template: 'plantilla de inventario de Pango',
    templateFile: 'Plantilla_Inventario_PANGO_v1.xlsx',
    cta: 'Importar inventario',
    fileTitle: 'Elige tu archivo de inventario',
  },
  movements: {
    title: 'Movimientos',
    tagline: 'Historial para los pronósticos',
    description:
      'Entradas y salidas pasadas. Pango aprende cómo se consume tu inventario y calcula los pronósticos.',
    needs: ['Nº de movimiento', 'Línea', 'Fecha', 'Bodega', 'SKU', 'Tipo', 'Cantidad'],
    usage:
      'Úsalo para cargar meses de historial. No cambia tus existencias de hoy. Los productos y bodegas deben existir en Pango.',
    template: 'plantilla de movimientos',
    templateFile: 'Plantilla_Movimientos_PANGO.csv',
    cta: 'Importar movimientos',
    fileTitle: 'Elige tu archivo de movimientos',
  },
};

export const KIND_NAME: Record<ImportKind, string> = {
  inventory: 'Inventario',
  movements: 'Movimientos',
};

export const WIZARD_STEPS = [
  'Archivo',
  'Columnas',
  'Vista previa',
  'Confirmación',
  'Resultado',
] as const;

export const STATUS_LABEL: Record<ImportStatus, string> = {
  COMPLETED: 'Completada',
  PARTIAL: 'Con filas omitidas',
  FAILED: 'Falló',
};

export const STATUS_TONE: Record<ImportStatus, 'success' | 'warning' | 'danger'> = {
  COMPLETED: 'success',
  PARTIAL: 'warning',
  FAILED: 'danger',
};

export const RESULT_LABEL: Record<RowResult, string> = {
  VALID: 'Válida',
  NO_CHANGE: 'Sin cambio',
  NEW: 'Nuevo',
  ERROR: 'Error',
};

export const PROCESSING_STEPS: Record<ImportKind, { id: ProcessingStepId; label: string }[]> = {
  inventory: [
    { id: 'READ', label: 'Archivo leído' },
    { id: 'VALIDATED', label: 'Filas validadas' },
    { id: 'SAVING', label: 'Creando ajustes de inventario' },
    { id: 'ALERTS', label: 'Recalculando alertas de stock' },
  ],
  movements: [
    { id: 'READ', label: 'Archivo leído' },
    { id: 'VALIDATED', label: 'Filas validadas' },
    { id: 'SAVING', label: 'Guardando movimientos' },
    { id: 'ALERTS', label: 'Actualizando el historial de los pronósticos' },
  ],
};

export const QUALITY_LABEL: Record<DataQuality, string> = {
  GOOD: 'Buena',
  REGULAR: 'Regular',
  LOW: 'Baja',
};

export const QUALITY_TONE: Record<DataQuality, 'success' | 'warning' | 'danger'> = {
  GOOD: 'success',
  REGULAR: 'warning',
  LOW: 'danger',
};

export const QUALITY_EFFECT: Record<DataQuality, string> = {
  GOOD: 'Pronóstico confiable',
  REGULAR: 'Pronóstico con cautela',
  LOW: 'Faltan datos para predecir',
};

export const MAX_ROWS = 500_000;

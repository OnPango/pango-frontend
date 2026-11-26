import { formatQuantity, type UnitRef } from '@/shared/lib/units';
import type {
  CalculationIssue,
  ReorderMethod,
  Replenishment,
  ValueSource,
} from '../types/inventory.types';

export const SOURCE_LABELS: Record<ValueSource, { label: string; long: string }> = {
  manual: { label: 'Manual', long: 'Definido a mano' },
  calculated: { label: 'Calculado', long: 'Calculado por el pronóstico' },
};

export const METHOD_LABELS: Record<
  ReorderMethod,
  { label: string; title: string; description: string }
> = {
  forecast: {
    label: 'Sistema',
    title: 'Sistema (pronóstico)',
    description:
      'Calculados con el pronóstico y el tiempo de entrega. Cada nueva predicción los actualiza automáticamente.',
  },
  manual: {
    label: 'Manual',
    title: 'Manual',
    description:
      'Usas los valores que definas a mano. Las nuevas predicciones no los sobrescriben.',
  },
};

export const CALCULATION_ISSUE_LABELS: Record<CalculationIssue, { title: string; detail: string }> =
  {
    no_forecast: {
      title: 'Sin pronóstico vigente',
      detail:
        'Aún no hay un pronóstico válido para este producto en este almacén. Mientras tanto, se usan los valores manuales como respaldo.',
    },
    no_interval: {
      title: 'Pronóstico sin intervalo',
      detail:
        'El pronóstico vigente no trae el intervalo del horizonte necesario para el cálculo. Se usan los valores manuales como respaldo.',
    },
    no_lead_time: {
      title: 'Sin tiempo de entrega',
      detail:
        'Define un tiempo de entrega entre 1 y 365 días para calcular los valores del sistema.',
    },
  };

type Severity = NonNullable<Replenishment['openAlert']>['severity'];

export const ALERT_LABELS: Record<Severity, string> = {
  1: 'Bajo el punto de reorden',
  2: 'Bajo el stock de seguridad',
  3: 'Sin disponible',
};

export function formatCalculatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatReplenishmentNotice(
  productName: string,
  warehouseName: string,
  unit: UnitRef,
  saved: Replenishment,
): string {
  const amount = (value: number) => formatQuantity(value, unit);
  const modeNote =
    saved.method === 'forecast'
      ? saved.source === 'calculated'
        ? `con valores del sistema (tiempo de entrega: ${saved.leadTimeDays} ${saved.leadTimeDays === 1 ? 'día' : 'días'}).`
        : 'en modo sistema (usando respaldo manual mientras haya pronóstico vigente).'
      : 'con valores manuales.';
  const outcome =
    saved.reorderPoint === 0
      ? 'Sin punto de reorden: no habrá alertas.'
      : saved.openAlert
        ? `Disponible ${amount(saved.available)} ≤ punto de reorden ${amount(saved.reorderPoint)}: alerta abierta (${ALERT_LABELS[saved.openAlert.severity].toLowerCase()}).`
        : `Disponible ${amount(saved.available)} > punto de reorden ${amount(saved.reorderPoint)}: sin alerta.`;
  return `Reposición de «${productName}» en ${warehouseName} guardada ${modeNote} ${outcome}`;
}

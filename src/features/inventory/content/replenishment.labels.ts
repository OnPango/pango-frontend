import type { Replenishment, ValueSource } from '../types/inventory.types';

export const SOURCE_LABELS: Record<ValueSource, { label: string; long: string }> = {
  manual: { label: 'Manual', long: 'Definido a mano' },
  calculated: { label: 'Calculado', long: 'Calculado por el pronóstico' },
};

type Severity = NonNullable<Replenishment['openAlert']>['severity'];

export const ALERT_LABELS: Record<Severity, string> = {
  1: 'Bajo el punto de reorden',
  2: 'Bajo el stock de seguridad',
  3: 'Sin disponible',
};

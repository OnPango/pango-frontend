import { movementTypeLabel } from '@/shared/lib/movementTypes';
import { cn } from '@/shared/lib/cn';
import { NATURE_LABELS } from '../content/movement.labels';
import type { MovementTypeRef } from '../types/movements.types';

/** The type in Spanish with the icon of its direction (entrada, salida, ajuste). */
export function MovementTypeLabel({ type }: { type: MovementTypeRef }) {
  const nature = NATURE_LABELS[type.nature];
  const Icon = nature.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-fg/90" title={nature.label}>
      <Icon aria-hidden className={cn('size-4 shrink-0', nature.className)} />
      {movementTypeLabel(type)}
    </span>
  );
}

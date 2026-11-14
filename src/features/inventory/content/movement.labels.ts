import type { MovementKind } from '../types/inventory.types';

export const KIND_LABELS: Record<MovementKind, { title: string; noun: string }> = {
  inbound: { title: 'Registrar entrada', noun: 'Entrada' },
  outbound: { title: 'Registrar salida', noun: 'Salida' },
};

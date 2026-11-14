import type { MovementKind, RegisteredMovement } from '../types/inventory.types';

export const KIND_LABELS: Record<MovementKind, { title: string; noun: string }> = {
  inbound: { title: 'Registrar entrada', noun: 'Entrada' },
  outbound: { title: 'Registrar salida', noun: 'Salida' },
};

/** "Entrada MV-00000012 registrada." / "Ajuste MV-00000013 registrado." */
export const registeredText = ({ kind, number }: Pick<RegisteredMovement, 'kind' | 'number'>) =>
  kind === 'adjustment'
    ? `Ajuste ${number} registrado.`
    : `${KIND_LABELS[kind].noun} ${number} registrada.`;

/** "Se suman 3 unidades" / "Se suma 1 unidad"; past: "Se sumaron…" / "Se sumó…". */
export function adjustedText(removes: boolean, quantity: number, amount: string, past = false) {
  const one = quantity === 1;
  const verb = removes
    ? past
      ? one
        ? 'restó'
        : 'restaron'
      : one
        ? 'resta'
        : 'restan'
    : past
      ? one
        ? 'sumó'
        : 'sumaron'
      : one
        ? 'suma'
        : 'suman';
  return `Se ${verb} ${amount}`;
}

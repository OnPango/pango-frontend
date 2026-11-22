import type { MovementKind, RegisteredMovement } from '../types/inventory.types';

export const KIND_LABELS: Record<MovementKind, { title: string; noun: string }> = {
  inbound: { title: 'Registrar entrada', noun: 'Entrada' },
  outbound: { title: 'Registrar salida', noun: 'Salida' },
};

/**
 * "Entrada MV-00000012 registrada." / "Ajuste MV-00000013 registrado." / "Traslado MV-00000014
 * registrado: va en camino a Bodega Norte."
 */
export function registeredText({
  kind,
  number,
  destination,
  inTransit,
}: Pick<RegisteredMovement, 'kind' | 'number' | 'destination' | 'inTransit'>) {
  if (kind === 'adjustment') return `Ajuste ${number} registrado.`;
  if (kind === 'transfer') {
    const to = destination?.name ?? 'el destino';
    return inTransit
      ? `Traslado ${number} registrado: va en camino a ${to}, que debe recibirlo.`
      : `Traslado ${number} registrado: ya está en ${to}.`;
  }
  return `${KIND_LABELS[kind].noun} ${number} registrada.`;
}

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

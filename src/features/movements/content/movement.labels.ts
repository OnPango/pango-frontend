import type { IconType } from 'react-icons';
import { FiArrowDownLeft, FiArrowUpRight, FiClipboard, FiRepeat } from 'react-icons/fi';
import { formatQuantity } from '@/shared/lib/units';
import type { Movement, MovementLine, MovementNature } from '../types/movements.types';

/** The direction of a type, with the icons of Inventario's "Registrar entrada / salida". */
export const NATURE_LABELS: Record<
  MovementNature,
  { label: string; icon: IconType; className: string }
> = {
  inbound: { label: 'Entrada', icon: FiArrowDownLeft, className: 'text-success' },
  outbound: { label: 'Salida', icon: FiArrowUpRight, className: 'text-danger' },
  adjustment: { label: 'Ajuste', icon: FiClipboard, className: 'text-primary' },
  transfer: { label: 'Traslado', icon: FiRepeat, className: 'text-muted' },
};

export const SOURCE_LABELS = {
  manual: 'Manual',
  stockRequest: 'Solicitud',
} as const;

/**
 * The request a movement fulfilled: pango-core writes its number (`SR-00000004`) as the
 * movement's document. `null` for other movements.
 */
export function requestNumberOf(movement: Pick<Movement, 'source' | 'documentRef'>): string | null {
  return movement.source === 'stockRequest' && movement.documentRef?.startsWith('SR-')
    ? movement.documentRef
    : null;
}

/** "7:13 p. m.": the time of a movement, below its date. */
export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function formatDate(iso: string, withTime = false): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * What some lines moved, with its sign: "+500 cajas", "−1 unidad". The lines are of one product
 * (one unit); `null` when they cancel out.
 */
export function signedQuantity(lines: MovementLine[]): { text: string; sign: 1 | -1 } | null {
  if (lines.length === 0) return null;
  const net = lines.reduce((sum, line) => sum + (line.removes ? -line.quantity : line.quantity), 0);
  const rounded = Number(net.toFixed(4));
  if (rounded === 0) return null;
  const sign = rounded > 0 ? 1 : -1;
  return {
    text: `${sign > 0 ? '+' : '−'}${formatQuantity(Math.abs(rounded), lines[0].product.unit)}`,
    sign,
  };
}

/** "Drone", "Drone y 2 más": the products of a movement in one line. */
export function productsSummary(lines: MovementLine[]): string {
  const names = [...new Set(lines.map((line) => line.product.name))];
  return names.length <= 1 ? (names[0] ?? '') : `${names[0]} y ${names.length - 1} más`;
}

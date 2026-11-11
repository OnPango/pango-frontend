import type { RequestPriority, RequestStatus, RequestType } from '../types/requests.types';

type Tone = 'warning' | 'primary' | 'success' | 'danger' | 'neutral';

export const STATUS_LABELS: Record<RequestStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pendiente', tone: 'warning' },
  inProgress: { label: 'En atención', tone: 'primary' },
  fulfilled: { label: 'Atendida', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
};

/** RF-REQ-007. `available`: pango-core accepts it today (only internal consumption, for the MVP). */
export const TYPE_LABELS: Record<
  RequestType,
  { label: string; description: string; available: boolean }
> = {
  internalConsumption: {
    label: 'Consumo interno',
    description: 'El área usa los productos. Cuenta como demanda para el pronóstico.',
    available: true,
  },
  internalReplenishment: {
    label: 'Reposición interna',
    description: 'Disponible más adelante.',
    available: false,
  },
  return: { label: 'Devolución', description: 'Disponible más adelante.', available: false },
  incident: {
    label: 'Novedad (daño, pérdida, vencimiento)',
    description: 'Disponible más adelante.',
    available: false,
  },
};

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  1: 'Alta',
  2: 'Media',
  3: 'Baja',
};

export function formatDate(iso: string, withTime = false): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(new Date(iso.length === 10 ? `${iso}T12:00:00` : iso));
  } catch {
    return iso;
  }
}

/** "Tornillo M8", "Tornillo M8 y Tuerca M8", "Tornillo M8 y 2 más". */
export function productsSummary(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names[0]} y ${names.length - 1} más`;
}

/** Today as `YYYY-MM-DD`, local time. */
export function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

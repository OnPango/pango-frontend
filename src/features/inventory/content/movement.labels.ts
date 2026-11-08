import type { MovementKind, MovementType } from '../types/inventory.types';

/** Spanish names for the movement types the backend seeds; custom types keep their name. */
const BASE_TYPES: Record<string, { label: string; description: string }> = {
  'Opening balance': {
    label: 'Saldo inicial',
    description: 'La existencia con la que empiezas a usar Pango.',
  },
  'Purchase receipt': {
    label: 'Compra o recepción',
    description: 'Llega mercancía de un proveedor.',
  },
  'Consumption issue': {
    label: 'Consumo interno',
    description: 'Sale para uso de un área. Cuenta como demanda para el pronóstico.',
  },
  'Inventory adjustment': {
    label: 'Ajuste de inventario',
    description: 'Corrige la existencia.',
  },
  Transfer: { label: 'Traslado', description: 'Pasa de un almacén a otro.' },
};

export const movementTypeLabel = (type: MovementType) => BASE_TYPES[type.name]?.label ?? type.name;

export function movementTypeDescription(type: MovementType): string | undefined {
  const base = BASE_TYPES[type.name]?.description;
  if (base) return base;
  return type.countsAsDemand ? 'Cuenta como demanda para el pronóstico.' : undefined;
}

export const KIND_LABELS: Record<MovementKind, { title: string; noun: string }> = {
  inbound: { title: 'Registrar entrada', noun: 'Entrada' },
  outbound: { title: 'Registrar salida', noun: 'Salida' },
};

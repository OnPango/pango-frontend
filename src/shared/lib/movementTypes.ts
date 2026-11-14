/**
 * Spanish names for the movement types pango-core seeds with every organization (it sends their
 * English names); custom types keep their own name. Shared by registering movements (Inventario)
 * and the movement history (Movimientos).
 */
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

interface TypeRef {
  name: string;
  countsAsDemand: boolean;
}

export const movementTypeLabel = (type: Pick<TypeRef, 'name'>) =>
  BASE_TYPES[type.name]?.label ?? type.name;

export function movementTypeDescription(type: TypeRef): string | undefined {
  const base = BASE_TYPES[type.name]?.description;
  if (base) return base;
  return type.countsAsDemand ? 'Cuenta como demanda para el pronóstico.' : undefined;
}

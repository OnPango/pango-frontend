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
    description: 'Sale para uso de un área. Cuenta como demanda solo cuando atiende una solicitud.',
  },
  'Sales issue': {
    label: 'Venta',
    description:
      'Sale vendida a un cliente; anota la factura en el documento. Cuenta como demanda para el pronóstico.',
  },
  'Inventory adjustment': {
    label: 'Ajuste de inventario',
    description: 'Corrige la existencia con lo que se contó.',
  },
  Transfer: { label: 'Traslado', description: 'Pasa de un almacén a otro.' },
};

interface TypeRef {
  name: string;
  countsAsDemand: boolean;
}

/**
 * Whether a movement feeds the demand history (pango-core's `docs/database.md`): its type counts
 * as demand, and a "Consumption issue" only when it fulfils a stock request, so consumption is
 * always traceable to an area. Sales count as they are.
 */
export const feedsDemand = (type: TypeRef, fulfilsRequest: boolean) =>
  type.countsAsDemand && (type.name !== 'Consumption issue' || fulfilsRequest);

export const movementTypeLabel = (type: Pick<TypeRef, 'name'>) =>
  BASE_TYPES[type.name]?.label ?? type.name;

export function movementTypeDescription(type: TypeRef): string | undefined {
  const base = BASE_TYPES[type.name]?.description;
  if (base) return base;
  return type.countsAsDemand ? 'Cuenta como demanda para el pronóstico.' : undefined;
}

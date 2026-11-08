import type { Warehouse, WarehouseFilters, WarehouseType } from '../types/warehouses.types';

export const TYPE_LABELS: Record<WarehouseType, string> = {
  warehouse: 'Bodega',
  store: 'Tienda',
};

const TYPE_PREFIX: Record<WarehouseType, string> = { warehouse: 'BOD', store: 'TDA' };

/** Words that say nothing about which warehouse it is ("Bodega de la zona norte" → ZONA-NORTE). */
const FILLER = new Set(['bodega', 'tienda', 'almacen', 'de', 'del', 'la', 'el', 'los', 'las', 'y']);

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * A code proposed from the name and type, editable: "Bodega Norte" → `BOD-NORTE`,
 * "Tienda Centro Mayor" → `TDA-CENTRO-MAYOR`. At most 20 characters, the API's limit.
 */
export function suggestCode(name: string, type: WarehouseType): string {
  const words = plain(name)
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !FILLER.has(word));
  if (words.length === 0) return '';
  return [TYPE_PREFIX[type], ...words].join('-').toUpperCase().slice(0, 20).replace(/-+$/, '');
}

/** The warehouses matching the list's filters, in the order they came (by name). */
export function filterWarehouses(warehouses: Warehouse[], filters: WarehouseFilters): Warehouse[] {
  const words = plain(filters.search).split(/\s+/).filter(Boolean);
  return warehouses.filter((warehouse) => {
    if (filters.status === 'active' && !warehouse.isActive) return false;
    if (filters.status === 'inactive' && warehouse.isActive) return false;
    if (filters.type !== 'all' && warehouse.type !== filters.type) return false;
    const haystack = plain(`${warehouse.code} ${warehouse.name} ${warehouse.address ?? ''}`);
    return words.every((word) => haystack.includes(word));
  });
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

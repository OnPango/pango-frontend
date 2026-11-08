import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import type { ProductCategory, UnitOfMeasure } from '../types/products.types';

/** Spanish names for the units the backend seeds (UN/ECE codes); other units keep theirs. */
const UNIT_LABELS: Record<string, string> = {
  EA: 'Unidad',
  KGM: 'Kilogramo',
  GRM: 'Gramo',
  LTR: 'Litro',
  MLT: 'Mililitro',
  MTR: 'Metro',
  BX: 'Caja',
  PK: 'Paquete',
};

export const unitLabel = (unit: UnitOfMeasure) => UNIT_LABELS[unit.code] ?? unit.name;

/**
 * Each family's name with the families above it ("Ferretería › Tornillos"), so two subfamilies
 * with the same name can be told apart. A broken chain (a parent that is not in the list) stops there.
 */
export function categoryPaths(categories: ProductCategory[]): Map<string, string> {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const paths = new Map<string, string>();
  for (const category of categories) {
    const names = [category.name];
    const seen = new Set([category.id]);
    let parent = category.parentId ? byId.get(category.parentId) : undefined;
    while (parent && !seen.has(parent.id)) {
      names.unshift(parent.name);
      seen.add(parent.id);
      parent = parent.parentId ? byId.get(parent.parentId) : undefined;
    }
    paths.set(category.id, names.join(' › '));
  }
  return paths;
}

export interface CategorySelectOptionConfig {
  /** If provided, prepends an option for "all categories" with this value and label. */
  allOption?: { value: string; label: string };
  /** Only include active categories (e.g. for creating products). Default: false. */
  onlyActive?: boolean;
  /** Kept even if inactive: the family a product being edited already has. */
  keepId?: string;
}

/** Formats categories as select options sorted alphabetically, displaying hierarchical paths. */
export function toCategorySelectOptions(
  categories: ProductCategory[],
  config: CategorySelectOptionConfig = {},
): SelectOption[] {
  const paths = categoryPaths(categories);
  const filtered = config.onlyActive
    ? categories.filter((category) => category.isActive || category.id === config.keepId)
    : categories;

  const options: SelectOption[] = filtered
    .map((category) => ({
      value: category.id,
      label: paths.get(category.id) ?? category.name,
      description: category.isActive ? undefined : 'Inactiva',
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));

  if (config.allOption) {
    return [config.allOption, ...options];
  }

  return options;
}

/** Physical data in one line ("5 × 2 × 1 cm · 0,012 kg · 0,01 L"), or null when there is none. */
export function formatMeasures(product: {
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  volumeL: number | null;
}): string | null {
  const number = (value: number) => value.toLocaleString('es-CO', { maximumFractionDigits: 4 });
  const parts: string[] = [];
  const sides = [product.lengthCm, product.widthCm, product.heightCm];
  if (sides.some((side) => side !== null)) {
    parts.push(`${sides.map((side) => (side === null ? '–' : number(side))).join(' × ')} cm`);
  }
  if (product.weightKg !== null) parts.push(`${number(product.weightKg)} kg`);
  if (product.volumeL !== null) parts.push(`${number(product.volumeL)} L`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

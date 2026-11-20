/** A unit of measure as the API sends it: UN/ECE code plus its (English) name. */
export interface UnitRef {
  code: string;
  name: string;
}

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

export const unitLabel = (unit: UnitRef) => UNIT_LABELS[unit.code] ?? unit.name;

/** How a quantity reads: countable units by name ("1 caja", "12 cajas"), measures by symbol. */
const QUANTITY_UNITS: Record<string, { one: string; many: string } | string> = {
  EA: { one: 'unidad', many: 'unidades' },
  BX: { one: 'caja', many: 'cajas' },
  PK: { one: 'paquete', many: 'paquetes' },
  KGM: 'kg',
  GRM: 'g',
  LTR: 'L',
  MLT: 'mL',
  MTR: 'm',
};

export const formatNumber = (value: number) =>
  value.toLocaleString('es-CO', { maximumFractionDigits: 4 });

/** "132 unidades", "1 caja", "2,5 kg"; an unknown unit falls back to its code. */
export function formatQuantity(value: number, unit: UnitRef): string {
  const word = QUANTITY_UNITS[unit.code];
  const suffix =
    word === undefined
      ? unit.code
      : typeof word === 'string'
        ? word
        : value === 1
          ? word.one
          : word.many;
  return `${formatNumber(value)} ${suffix}`;
}

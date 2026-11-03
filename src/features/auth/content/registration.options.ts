import type { SelectOption } from '@/shared/ui/components/form/select/select.types';

/** Catalogs of the registration form. `value` is the stable code sent to the API; `label` is Spanish UI text. */

export const SECTOR_OPTIONS: SelectOption[] = [
  { value: 'distribution_commerce', label: 'Distribución y comercio' },
  { value: 'manufacturing', label: 'Manufactura' },
  { value: 'food_beverage', label: 'Alimentos y bebidas' },
  { value: 'construction_hardware', label: 'Construcción y ferretería' },
  { value: 'health_pharmacy', label: 'Salud y farmacia' },
  { value: 'technology_parts', label: 'Tecnología y repuestos' },
  { value: 'other', label: 'Otro' },
];

export const TEAM_SIZE_OPTIONS: SelectOption[] = [
  { value: 'solo', label: 'Solo yo' },
  { value: '2_10', label: '2 a 10 personas' },
  { value: '11_50', label: '11 a 50 personas' },
  { value: '51_200', label: '51 a 200 personas' },
  { value: '200_plus', label: 'Más de 200 personas' },
];

export const ITEMS_RANGE_OPTIONS: SelectOption[] = [
  { value: 'lt_100', label: 'Menos de 100' },
  { value: '100_1k', label: '100 a 1.000' },
  { value: '1k_10k', label: '1.000 a 10.000' },
  { value: 'gt_10k', label: 'Más de 10.000' },
];

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: 'CO', label: 'Colombia' },
  { value: 'MX', label: 'México' },
  { value: 'PE', label: 'Perú' },
  { value: 'CL', label: 'Chile' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'OTHER', label: 'Otro' },
];

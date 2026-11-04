import type { SelectOption } from '@/shared/ui/components/form/select/select.types';

/**
 * Catalogs of the sign-up form. `value` is the enum the API expects (`BusinessSector`, `TeamSize`,
 * `ProductCount`, ISO 3166-1 alpha-2 for countries); `label` is Spanish UI text.
 */

export const BUSINESS_SECTOR_OPTIONS: SelectOption[] = [
  { value: 'RETAIL', label: 'Comercio minorista' },
  { value: 'WHOLESALE', label: 'Distribución y comercio mayorista' },
  { value: 'MANUFACTURING', label: 'Manufactura' },
  { value: 'FOOD_AND_BEVERAGE', label: 'Alimentos y bebidas' },
  { value: 'PHARMACY_AND_HEALTH', label: 'Farmacia y salud' },
  { value: 'HARDWARE_AND_CONSTRUCTION', label: 'Ferretería y construcción' },
  { value: 'FASHION_AND_APPAREL', label: 'Moda y confección' },
  { value: 'TECHNOLOGY', label: 'Tecnología y repuestos' },
  { value: 'AGRICULTURE', label: 'Agricultura' },
  { value: 'SERVICES', label: 'Servicios' },
  { value: 'OTHER', label: 'Otro' },
];

export const TEAM_SIZE_OPTIONS: SelectOption[] = [
  { value: 'SIZE_1_5', label: '1 a 5 personas' },
  { value: 'SIZE_6_20', label: '6 a 20 personas' },
  { value: 'SIZE_21_50', label: '21 a 50 personas' },
  { value: 'SIZE_51_200', label: '51 a 200 personas' },
  { value: 'SIZE_201_PLUS', label: 'Más de 200 personas' },
];

export const PRODUCT_COUNT_OPTIONS: SelectOption[] = [
  { value: 'COUNT_1_100', label: '1 a 100' },
  { value: 'COUNT_101_500', label: '101 a 500' },
  { value: 'COUNT_501_2000', label: '501 a 2.000' },
  { value: 'COUNT_2001_10000', label: '2.001 a 10.000' },
  { value: 'COUNT_10001_PLUS', label: 'Más de 10.000' },
];

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: 'CO', label: 'Colombia' },
  { value: 'MX', label: 'México' },
  { value: 'PE', label: 'Perú' },
  { value: 'CL', label: 'Chile' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'AR', label: 'Argentina' },
  { value: 'PA', label: 'Panamá' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'ES', label: 'España' },
];

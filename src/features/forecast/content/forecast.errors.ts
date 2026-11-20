import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the demand and forecasting endpoints. */
const MESSAGES: Record<string, string> = {
  FORECAST_SERVICE_NOT_CONFIGURED:
    'El servicio de pronóstico no está configurado. Avísale al administrador de Pango.',
  FORECAST_RUN_IN_PROGRESS:
    'Ya hay un pronóstico en curso. Espera a que termine para iniciar otro.',
  NOTHING_TO_FORECAST:
    'No hay productos con demanda ni movimientos de inventario para pronosticar en ese alcance.',
  FORECAST_RUN_NOT_FOUND: 'Esa ejecución no existe.',
  WAREHOUSE_NOT_FOUND: 'El almacén ya no está activo o no tienes acceso a sus pronósticos.',
  PRODUCT_NOT_FOUND: 'El producto ya no está activo.',
  RANGE_INVALID: 'El rango de fechas no es válido.',
  RANGE_TOO_LARGE: 'El rango de fechas es demasiado largo.',
  FORBIDDEN: 'No tienes permiso para esto.',
};

export function forecastErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

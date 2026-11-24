import { computeReorderPoint } from '@/shared/lib/reorderPoint';
import type {
  CalculationIssue,
  CurrentForecastSummary,
  Replenishment,
} from '../types/inventory.types';

export type SystemPreviewState =
  | {
      kind: 'ready';
      safetyStock: number;
      reorderPoint: number;
      isPreview: boolean;
      calculatedAt: string | null;
      horizonWeeks: number | null;
      historyEnd: string | null;
      leadTimeDays: number;
    }
  | { kind: 'loading' }
  | { kind: 'invalid_lead_time' }
  | { kind: 'unavailable'; issue: CalculationIssue }
  | { kind: 'unreadable' };

/**
 * Resolves the system-calculated safety stock and reorder point for side-by-side display:
 * uses persisted calculated values when the lead time still matches them, otherwise previews
 * from the current OK forecast (using the exact upper-band formula from `pango-core`).
 */
export function resolveSystemValues({
  replenishment,
  forecast,
  forecastStatus,
  canReadForecast,
  leadTimeDays,
}: {
  replenishment: Replenishment;
  forecast: CurrentForecastSummary | null | undefined;
  forecastStatus: 'pending' | 'error' | 'success';
  canReadForecast: boolean;
  leadTimeDays: number | null;
}): SystemPreviewState {
  if (leadTimeDays === null) return { kind: 'invalid_lead_time' };

  if (replenishment.source === 'calculated' && leadTimeDays === replenishment.leadTimeDays) {
    return {
      kind: 'ready',
      safetyStock: replenishment.safetyStock,
      reorderPoint: replenishment.reorderPoint,
      isPreview: false,
      calculatedAt: replenishment.calculatedAt,
      horizonWeeks: forecast?.horizonWeeks ?? null,
      historyEnd: forecast?.historyEnd ?? null,
      leadTimeDays,
    };
  }

  if (
    forecast &&
    forecast.estimate !== null &&
    forecast.upper !== null &&
    forecast.horizonDays > 0
  ) {
    const computed = computeReorderPoint(
      {
        estimate: forecast.estimate,
        upper: forecast.upper,
        horizonDays: forecast.horizonDays,
      },
      leadTimeDays,
    );
    return {
      kind: 'ready',
      safetyStock: computed.safetyStock,
      reorderPoint: computed.reorderPoint,
      isPreview: true,
      calculatedAt: null,
      horizonWeeks: forecast.horizonWeeks,
      historyEnd: forecast.historyEnd,
      leadTimeDays,
    };
  }

  if (canReadForecast && forecastStatus === 'pending') return { kind: 'loading' };

  if (canReadForecast && forecastStatus === 'success') {
    return { kind: 'unavailable', issue: forecast ? 'no_interval' : 'no_forecast' };
  }

  if (replenishment.calculationIssue !== null) {
    return { kind: 'unavailable', issue: replenishment.calculationIssue };
  }

  return { kind: 'unreadable' };
}

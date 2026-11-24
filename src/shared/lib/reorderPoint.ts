/** Default days from ordering to having the stock available (`pango-core` default). */
export const DEFAULT_LEAD_TIME_DAYS = 7;

export const MIN_LEAD_TIME_DAYS = 1;
export const MAX_LEAD_TIME_DAYS = 365;

export interface ForecastHorizonTotal {
  estimate: number;
  upper: number;
  /** Days covered by the total: the forecast run's horizon in weeks × 7. */
  horizonDays: number;
}

/** Avoids IEEE-754 artifacts like 2.5000000000000004 rounding up to 2.5001. */
function roundUp4(value: number): number {
  if (value <= 0) return 0;
  return Math.ceil(value * 10_000 - 1e-9) / 10_000;
}

/**
 * Upper-band reorder point method matching `pango-core/src/replenishment/reorder-point.ts`:
 *
 *   expected = estimate * L / H
 *   safety   = max(upper - estimate, 0) * sqrt(L / H)
 *   reorder  = expected + safety
 *
 * Both values are rounded up to 4 decimal places.
 */
export function computeReorderPoint(
  total: ForecastHorizonTotal,
  leadTimeDays: number,
): { safetyStock: number; reorderPoint: number } {
  const ratio = leadTimeDays / total.horizonDays;
  const expected = total.estimate * ratio;
  const band = Math.max(total.upper - total.estimate, 0);
  const safetyRaw = band * Math.sqrt(ratio);
  return {
    safetyStock: roundUp4(safetyRaw),
    reorderPoint: roundUp4(expected + safetyRaw),
  };
}


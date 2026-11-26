import { formatShortDay } from '../content/dashboard.labels';
import type { LevelPoint } from '../types/dashboard.types';

const label = (point: LevelPoint, weekly: boolean) =>
  weekly ? `Sem. ${formatShortDay(point.start)}` : formatShortDay(point.end);

/** A period of the chart: Pango's figures and, apart, the imported history's. */
export interface LevelRow extends LevelPoint {
  label: string;
  importedInStock: number;
  importedLowStock: number | null;
}

/** Joins the imported level to Pango's by period. */
export function joinLevels(
  points: LevelPoint[],
  imported: LevelPoint[] | undefined,
  weekly: boolean,
): LevelRow[] {
  const byEnd = new Map((imported ?? []).map((p) => [p.end, p]));
  return points.map((p) => {
    const other = byEnd.get(p.end);
    return {
      ...p,
      label: label(p, weekly),
      importedInStock: other?.inStock ?? 0,
      importedLowStock: other?.lowStock ?? null,
    };
  });
}

import { describe, expect, it } from 'vitest';
import { joinLevels } from './levels';

const point = (end: string, inStock: number, lowStock: number | null) => ({
  start: end,
  end,
  inStock,
  lowStock,
});

describe('joinLevels', () => {
  it('puts the imported figures of each period beside Pango’s', () => {
    const rows = joinLevels(
      [point('2026-11-23', 0, 0), point('2026-11-24', 40, 11)],
      [point('2026-11-23', 45, 9), point('2026-11-24', 0, 0)],
      false,
    );
    expect(rows.map((r) => [r.inStock, r.lowStock, r.importedInStock, r.importedLowStock])).toEqual(
      [
        [0, 0, 45, 9],
        [40, 11, 0, 0],
      ],
    );
  });

  it('shows nothing imported when the API does not offer it', () => {
    const [row] = joinLevels([point('2026-11-24', 40, null)], undefined, false);
    expect(row.importedInStock).toBe(0);
    expect(row.importedLowStock).toBeNull();
  });

  it('labels weekly periods by their first day', () => {
    const [row] = joinLevels(
      [{ start: '2026-11-23', end: '2026-11-26', inStock: 1, lowStock: 0 }],
      [],
      true,
    );
    expect(row.label).toMatch(/^Sem\. /);
  });
});

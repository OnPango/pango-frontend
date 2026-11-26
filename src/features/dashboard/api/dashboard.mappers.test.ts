import { describe, expect, it } from 'vitest';
import { toImportedLevel, toImportedMovements } from './dashboard.mappers';

describe('imported dashboard data', () => {
  it('reads the imported level with its last imported day', () => {
    expect(
      toImportedLevel({
        days: 30,
        granularity: 'DAY',
        lastImportedDay: '2026-11-23',
        points: [{ start: '2026-11-23', end: '2026-11-23', inStock: 45, lowStock: 9 }],
      }),
    ).toEqual({
      days: 30,
      granularity: 'day',
      lastImportedDay: '2026-11-23',
      points: [{ start: '2026-11-23', end: '2026-11-23', inStock: 45, lowStock: 9 }],
    });
  });

  it('signs the quantity of an imported line by its direction', () => {
    const line = {
      id: 7,
      date: '2026-11-20',
      movementType: 'SALE',
      product: { id: 3, sku: 'ACC-MOU-001', name: 'Mouse', unit: 'EA' },
      warehouse: { id: 1, code: 'BOD-BAQ', name: 'Bodega Barranquilla' },
      quantityIn: null,
      quantityOut: 4,
      documentRef: null,
      afterCutover: false,
      source: { importId: 5, sourceNamespace: 'siigo-cejtech', externalMovementId: 'FV-1' },
    };
    const list = toImportedMovements({
      total: 2,
      items: [
        line,
        {
          ...line,
          id: 8,
          movementType: 'PURCHASE_RECEIPT',
          quantityIn: 10,
          quantityOut: null,
          documentRef: 'OC-9',
        },
      ],
    });
    expect(list.items.map((i) => [i.quantity, i.document, i.product.id, i.system])).toEqual([
      [-4, 'FV-1', '3', 'siigo-cejtech'],
      [10, 'OC-9', '3', 'siigo-cejtech'],
    ]);
  });
});

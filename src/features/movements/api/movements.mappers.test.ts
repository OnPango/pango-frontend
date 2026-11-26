import { describe, expect, it } from 'vitest';
import type { HistoricalMovementDto } from './movements.dto';
import { toImportedMovement, toImportedQuery } from './movements.mappers';

const dto: HistoricalMovementDto = {
  id: 12,
  date: '2025-08-04',
  movementType: 'SALE',
  product: { id: 3, sku: 'ACC-MOU-001', name: 'Mouse inalámbrico', unit: 'EA' },
  warehouse: { id: 1, code: 'BOD-BAQ', name: 'Bodega Barranquilla' },
  quantityIn: null,
  quantityOut: 12,
  balance: 108,
  documentRef: 'FV-100',
  locationCode: 'DEFAULT',
  lotCode: null,
  unitCost: null,
  afterCutover: true,
  source: {
    importId: 5,
    sourceNamespace: 'siigo-cejtech',
    externalMovementId: 'FV-100',
    lineNumber: 2,
  },
};

describe('imported movements', () => {
  it('maps a historical movement with string ids', () => {
    expect(toImportedMovement(dto)).toEqual({
      id: '12',
      date: '2025-08-04',
      code: 'SALE',
      product: { id: '3', sku: 'ACC-MOU-001', name: 'Mouse inalámbrico', unit: 'EA' },
      warehouse: { id: '1', code: 'BOD-BAQ', name: 'Bodega Barranquilla' },
      quantityIn: null,
      quantityOut: 12,
      balance: 108,
      documentRef: 'FV-100',
      lotCode: null,
      unitCost: null,
      afterCutover: true,
      source: { importId: '5', system: 'siigo-cejtech', movementId: 'FV-100', line: 2 },
    });
  });

  it('sends business days as they are and leaves out empty filters', () => {
    expect(
      toImportedQuery({
        productId: '3',
        warehouseId: null,
        code: 'SALE',
        from: '2025-01-01',
        to: '2025-12-31',
        page: 2,
        pageSize: 25,
      }),
    ).toEqual({
      productId: 3,
      movementType: 'SALE',
      from: '2025-01-01',
      to: '2025-12-31',
      page: 2,
      pageSize: 25,
    });
  });
});

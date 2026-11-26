import type {
  ActivityItem,
  DashboardSummary,
  ImportedLevel,
  ImportedMovementList,
  InventoryLevel,
  LevelDays,
  MovementNature,
  ProductRef,
  Ref,
  Severity,
} from '../types/dashboard.types';
import type {
  DashboardLevelDto,
  DashboardSummaryDto,
  ImportedLevelDto,
  ImportedMovementPageDto,
} from './dashboard.dto';

const ref = (dto: { id: number; name: string }): Ref => ({ id: String(dto.id), name: dto.name });

/** The unit comes as a code only; its name is only a fallback for unknown codes. */
const product = (dto: { id: number; sku: string; name: string; unit: string }): ProductRef => ({
  id: String(dto.id),
  sku: dto.sku,
  name: dto.name,
  unit: { code: dto.unit, name: dto.unit },
});

/** Anything outside 1–3 reads as the mildest one. */
const severity = (value: number): Severity => (value === 3 ? 3 : value === 2 ? 2 : 1);

const STATUS: Record<string, ActivityItem['status']> = {
  IN_TRANSIT: 'inTransit',
  CONFIRMED: 'confirmed',
  VOIDED: 'voided',
};

export function toSummary(dto: DashboardSummaryDto): DashboardSummary {
  return {
    currency: dto.currency,
    comparedTo: dto.comparedTo,
    kpis: dto.kpis,
    lowStockItems: dto.lowStockItems && {
      total: dto.lowStockItems.total,
      items: dto.lowStockItems.items.map((item) => ({
        alertId: String(item.alertId),
        severity: severity(item.severity),
        status: item.status === 'ATTENDED' ? 'attended' : 'open',
        product: product(item.product),
        warehouse: ref(item.warehouse),
        available: item.available,
        reorderPoint: item.reorderPoint,
        suggested: item.suggested,
        daysOfCover: item.daysOfCover,
      })),
    },
    recentActivity:
      dto.recentActivity &&
      dto.recentActivity.map((item) => ({
        id: String(item.id),
        number: item.number,
        status: STATUS[item.status] ?? 'confirmed',
        type: item.type,
        nature: item.nature.toLowerCase() as MovementNature,
        occurredAt: item.occurredAt,
        warehouse: ref(item.warehouse),
        destinationWarehouse: item.destinationWarehouse && ref(item.destinationWarehouse),
        firstProduct: item.firstProduct,
        firstSku: item.firstSku,
        lineCount: item.lineCount,
        registeredBy: item.registeredBy,
      })),
  };
}

export function toImportedLevel(dto: ImportedLevelDto): ImportedLevel {
  return { ...toLevel(dto), lastImportedDay: dto.lastImportedDay };
}

export function toImportedMovements(dto: ImportedMovementPageDto): ImportedMovementList {
  return {
    total: dto.total,
    items: dto.items.map((item) => ({
      id: String(item.id),
      date: item.date,
      code: item.movementType,
      product: { ...item.product, id: String(item.product.id) },
      warehouse: { id: String(item.warehouse.id), name: item.warehouse.name },
      quantity: item.quantityIn ?? -(item.quantityOut ?? 0),
      document: item.documentRef ?? item.source.externalMovementId,
      system: item.source.sourceNamespace,
      afterCutover: item.afterCutover,
    })),
  };
}

export function toLevel(dto: DashboardLevelDto): InventoryLevel {
  return {
    days: (dto.days === 30 || dto.days === 90 ? dto.days : 7) as LevelDays,
    granularity: dto.granularity === 'WEEK' ? 'week' : 'day',
    points: dto.points,
  };
}

import { http } from '@/core/api/http';
import type { DashboardSummary, InventoryLevel, LevelDays } from '../types/dashboard.types';
import type { DashboardLevelDto, DashboardSummaryDto } from './dashboard.dto';
import { toLevel, toSummary } from './dashboard.mappers';

/** Only the chosen warehouse; without one, every warehouse the user reads. */
const params = (warehouseId: string | null) =>
  warehouseId ? { warehouseId: Number(warehouseId) } : undefined;

/** `GET /dashboard/summary`: each block is null when the user cannot read its module. */
export async function getSummary(warehouseId: string | null): Promise<DashboardSummary> {
  const { data } = await http.get<DashboardSummaryDto>('/dashboard/summary', {
    params: params(warehouseId),
  });
  return toSummary(data);
}

/** `GET /dashboard/inventory-level` (`stock.read`): stock and low stock over the last days. */
export async function getInventoryLevel(
  warehouseId: string | null,
  days: LevelDays,
): Promise<InventoryLevel> {
  const { data } = await http.get<DashboardLevelDto>('/dashboard/inventory-level', {
    params: { ...params(warehouseId), days },
  });
  return toLevel(data);
}

import { isAxiosError } from 'axios';
import { http } from '@/core/api/http';
import type {
  DashboardSummary,
  ImportedLevel,
  ImportedMovementList,
  InventoryLevel,
  LevelDays,
} from '../types/dashboard.types';
import type {
  DashboardLevelDto,
  DashboardSummaryDto,
  ImportedLevelDto,
  ImportedMovementPageDto,
} from './dashboard.dto';
import { toImportedLevel, toImportedMovements, toLevel, toSummary } from './dashboard.mappers';

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

/**
 * `GET /dashboard/imported-inventory-level` (`stock.read`): the same periods counted from the
 * imported history. An API without the endpoint answers 404: then there is nothing imported to show.
 */
export async function getImportedLevel(
  warehouseId: string | null,
  days: LevelDays,
): Promise<ImportedLevel | null> {
  try {
    const { data } = await http.get<ImportedLevelDto>('/dashboard/imported-inventory-level', {
      params: { ...params(warehouseId), days },
    });
    return toImportedLevel(data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

/** `GET /historical-movements` (`movement.read`): the latest imported lines, newest first. */
export async function getImportedMovements(
  warehouseId: string | null,
  pageSize: number,
): Promise<ImportedMovementList> {
  const { data } = await http.get<ImportedMovementPageDto>('/historical-movements', {
    params: { ...params(warehouseId), page: 1, pageSize },
  });
  return toImportedMovements(data);
}

import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  Warehouse,
  WarehouseType,
} from '../types/warehouses.types';
import type {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseDto,
  WarehouseTypeDto,
} from './warehouses.dto';

const TYPE_FROM_DTO: Record<WarehouseTypeDto, WarehouseType> = {
  WAREHOUSE: 'warehouse',
  STORE: 'store',
};
const TYPE_TO_DTO: Record<WarehouseType, WarehouseTypeDto> = {
  warehouse: 'WAREHOUSE',
  store: 'STORE',
};

export const toWarehouse = (dto: WarehouseDto): Warehouse => ({
  id: String(dto.id),
  code: dto.code,
  name: dto.name,
  type: TYPE_FROM_DTO[dto.type],
  address: dto.address,
  defaultLocation: dto.defaultLocation
    ? { id: String(dto.defaultLocation.id), code: dto.defaultLocation.code }
    : null,
  holdsStock: dto.holdsStock,
  isActive: dto.isActive,
  createdAt: dto.createdAt,
});

export const toCreateWarehouseDto = (input: CreateWarehouseInput): CreateWarehouseDto => ({
  code: input.code.trim(),
  name: input.name.trim(),
  type: TYPE_TO_DTO[input.type],
  address: input.address?.trim() || null,
  holdsStock: input.holdsStock,
});

/** Only the fields present in `input`, so the API leaves the others untouched. */
export function toUpdateWarehouseDto(input: UpdateWarehouseInput): UpdateWarehouseDto {
  const dto: UpdateWarehouseDto = {};
  if (input.code !== undefined) dto.code = input.code.trim();
  if (input.name !== undefined) dto.name = input.name.trim();
  if (input.type !== undefined) dto.type = TYPE_TO_DTO[input.type];
  if (input.address !== undefined) dto.address = input.address?.trim() || null;
  if (input.holdsStock !== undefined) dto.holdsStock = input.holdsStock;
  if (input.isActive !== undefined) dto.isActive = input.isActive;
  return dto;
}

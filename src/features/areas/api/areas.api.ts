import { http } from '@/core/api/http';
import type { Department, DepartmentInput, UpdateDepartmentInput } from '../types/areas.types';
import type { DepartmentBodyDto, DepartmentDto } from './areas.dto';

const toDepartment = (dto: DepartmentDto): Department => ({
  id: String(dto.id),
  name: dto.name,
  costCenter: dto.costCenter,
  isActive: dto.isActive,
  userCount: dto.userCount,
});

const toBody = (input: UpdateDepartmentInput): DepartmentBodyDto => ({
  ...(input.name !== undefined ? { name: input.name.trim() } : {}),
  ...(input.costCenter !== undefined ? { costCenter: input.costCenter?.trim() || null } : {}),
  ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
});

/** `GET /departments?status=ALL`: every area, sorted by name. Not paged. */
export async function getDepartments(): Promise<Department[]> {
  const { data } = await http.get<DepartmentDto[]>('/departments', { params: { status: 'ALL' } });
  return data.map(toDepartment);
}

/** `POST /departments`: the name is unique in the organization, ignoring case. */
export async function createDepartment(input: DepartmentInput): Promise<Department> {
  const { data } = await http.post<DepartmentDto>('/departments', toBody(input));
  return toDepartment(data);
}

/** `PATCH /departments/:id`: rename, change the cost center, or (de)activate. */
export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
): Promise<Department> {
  const { data } = await http.patch<DepartmentDto>(`/departments/${id}`, toBody(input));
  return toDepartment(data);
}

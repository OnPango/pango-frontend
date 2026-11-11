import { areas, persistAreas, persistUsers, users } from '../db';
import { authenticate, authorize, error } from '../guard';
import { numericId } from '../ids';
import type { MockRoutes } from '../server';

/**
 * Departments (áreas) of pango-core (`docs/stock-requests.md`), on the mock's area table. The mock
 * keeps one list for every organization; ids are the stable hash of the row's id.
 */

const isActive = (row: { is_active?: boolean }) => row.is_active !== false;

const toDto = (row: (typeof areas)[number]) => ({
  id: numericId(row.id),
  name: row.name,
  costCenter: row.cost_center ?? null,
  isActive: isActive(row),
  userCount: users.filter((user) => user.area_id === row.id).length,
});

const findArea = (id: string) => areas.find((row) => numericId(row.id) === Number(id));

const nameTaken = (name: string, exceptId?: string) =>
  areas.some((row) => row.id !== exceptId && row.name.toLowerCase() === name.trim().toLowerCase());

function validate(body: Record<string, unknown>, partial: boolean): string[] {
  const problems: string[] = [];
  const name = body.name;
  if (!(partial && name === undefined)) {
    if (typeof name !== 'string' || name.trim() === '') problems.push('name should not be empty');
    else if (name.trim().length > 80)
      problems.push('name must be shorter than or equal to 80 characters');
  }
  const costCenter = body.costCenter;
  if (costCenter !== undefined && costCenter !== null) {
    if (typeof costCenter !== 'string') problems.push('costCenter must be a string');
    else if (costCenter.trim().length > 30)
      problems.push('costCenter must be shorter than or equal to 30 characters');
  }
  return problems;
}

export const departmentsRoutes: MockRoutes = {
  'GET /departments': ({ query }) => {
    const auth = authenticate();
    if (auth.error) return auth.error;
    const status = query.status ?? 'ACTIVE';
    const list = areas
      .filter((row) => status === 'ALL' || (status === 'ACTIVE') === isActive(row))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return { status: 200, data: list.map(toDto) };
  },

  'GET /departments/:id': ({ params }) => {
    const auth = authenticate();
    if (auth.error) return auth.error;
    const row = findArea(params.id);
    if (!row) return error(404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
    return { status: 200, data: toDto(row) };
  },

  'POST /departments': ({ body }) => {
    const auth = authorize('department.manage');
    if (auth.error) return auth.error;
    const input = (body ?? {}) as Record<string, unknown>;
    const problems = validate(input, false);
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));
    const name = (input.name as string).trim();
    if (nameTaken(name)) {
      return error(409, 'DEPARTMENT_NAME_TAKEN', 'A department with this name already exists');
    }
    const row = {
      id: `area-${Date.now().toString(36)}`,
      name,
      cost_center: typeof input.costCenter === 'string' ? input.costCenter.trim() || null : null,
      is_active: true,
    };
    areas.push(row);
    persistAreas();
    return { status: 201, data: toDto(row) };
  },

  'PATCH /departments/:id': ({ params, body }) => {
    const auth = authorize('department.manage');
    if (auth.error) return auth.error;
    const row = findArea(params.id);
    if (!row) return error(404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
    const input = (body ?? {}) as Record<string, unknown>;
    const problems = validate(input, true);
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));
    if (typeof input.name === 'string') {
      if (nameTaken(input.name, row.id)) {
        return error(409, 'DEPARTMENT_NAME_TAKEN', 'A department with this name already exists');
      }
      row.name = input.name.trim();
    }
    if (input.costCenter !== undefined) {
      row.cost_center =
        typeof input.costCenter === 'string' ? input.costCenter.trim() || null : null;
    }
    if (typeof input.isActive === 'boolean') row.is_active = input.isActive;
    persistAreas();
    persistUsers();
    return { status: 200, data: toDto(row) };
  },
};

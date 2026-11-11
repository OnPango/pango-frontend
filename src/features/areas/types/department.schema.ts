import { z } from 'zod';
import type { Department } from './areas.types';

/** "Nueva área" / "Editar área". Limits mirror `CreateDepartmentDto` in pango-core. */
export const departmentSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del área.').max(80, 'Máximo 80 caracteres.'),
  costCenter: z.string().trim().max(30, 'Máximo 30 caracteres.'),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;

export const EMPTY_DEPARTMENT_FORM: DepartmentFormValues = { name: '', costCenter: '' };

export const toDepartmentFormValues = (department: Department): DepartmentFormValues => ({
  name: department.name,
  costCenter: department.costCenter ?? '',
});

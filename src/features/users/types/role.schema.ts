import { z } from 'zod';

/** "Nuevo rol" / "Editar rol". Limits mirror `CreateRoleDto` in pango-core. */
export const roleSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del rol.').max(60, 'Máximo 60 caracteres.'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres.'),
  /** Id of the role whose permissions the new one starts with; empty: none. Only when creating. */
  copyFrom: z.string(),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

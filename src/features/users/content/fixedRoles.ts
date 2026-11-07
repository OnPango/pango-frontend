import type { RoleOption } from '../types/users.types';

/**
 * The MVP's two fixed roles. pango-core has no `GET /roles` yet, and every organization is created
 * from the same migrations (Owner first, Operator second), so their ids are the same everywhere.
 * `useRoleOptions` lets the roles seen in real data override these, and this file goes away when
 * the endpoint exists.
 */
export const FIXED_ROLES: RoleOption[] = [
  { id: '1', name: 'Owner', isSystem: true },
  { id: '2', name: 'Operator', isSystem: false },
];

/** Spanish names for the fixed roles, as the screens show them. */
export const ROLE_LABELS: Record<string, string> = {
  Owner: 'Propietario',
  Admin: 'Administrador',
  Operator: 'Operador',
};

export const roleLabel = (name: string) => ROLE_LABELS[name] ?? name;

/** Mock ids are strings; the real API uses integers. A stable hash keeps the DTO shape. */
export const numericId = (id: string) =>
  [...id].reduce((hash, c) => (hash * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * The real organizations have two fixed roles with ids 1 (Owner) and 2 (Operator). The mock's
 * administrator and warehouse roles stand in for them so the app's fixed role list lines up.
 */
const FIXED_ROLE_IDS: Record<string, number> = { 'role-admin': 1, 'role-warehouse': 2 };
const FIXED_ROLE_NAMES: Record<string, string> = {
  'role-admin': 'Owner',
  'role-warehouse': 'Operator',
};

export const roleNumericId = (roleId: string) => FIXED_ROLE_IDS[roleId] ?? numericId(roleId);
export const roleApiName = (roleId: string, name: string) => FIXED_ROLE_NAMES[roleId] ?? name;

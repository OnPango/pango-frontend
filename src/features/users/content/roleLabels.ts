/** Spanish names for the system and seeded roles, as the screens show them. */
export const ROLE_LABELS: Record<string, string> = {
  Owner: 'Propietario',
  Admin: 'Administrador',
  Operator: 'Operador',
};

/** The role's Spanish name; roles created by the organization keep theirs. */
export const roleLabel = (name: string) => ROLE_LABELS[name] ?? name;

/** The descriptions pango-core seeds with those roles (its migrations), in Spanish. */
const SEEDED_DESCRIPTIONS: Record<string, string> = {
  'Full access to the organization': 'Acceso total a la organización.',
  'Manages the users and operations of their warehouse':
    'Gestiona las personas y la operación de su almacén.',
  'Day-to-day inventory operations, without user or organization administration':
    'Operación diaria del inventario, sin administrar personas ni la organización.',
};

/** The role's description in Spanish when it is the seeded one; one the organization wrote stays. */
export const roleDescription = (description: string | null) =>
  description === null ? null : (SEEDED_DESCRIPTIONS[description] ?? description);

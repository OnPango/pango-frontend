/** Spanish names for the system and seeded roles, as the screens show them. */
export const ROLE_LABELS: Record<string, string> = {
  Owner: 'Propietario',
  Admin: 'Administrador',
  Operator: 'Operador',
};

/** The role's Spanish name; roles created by the organization keep theirs. */
export const roleLabel = (name: string) => ROLE_LABELS[name] ?? name;

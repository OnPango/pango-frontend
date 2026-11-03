/** Pure business rules of the registration form (no React, no I/O), so they are easy to test. */

export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'number', label: 'Un número', test: (p) => /\d/.test(p) },
];

export const isPasswordValid = (password: string) => PASSWORD_RULES.every((r) => r.test(password));

/** 0 (empty) to 4: the rules met, plus one for a long passphrase. Only drives the visual meter. */
export function getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  const met = PASSWORD_RULES.filter((r) => r.test(password)).length;
  return Math.min(4, met + (password.length >= 12 ? 1 : 0)) as 0 | 1 | 2 | 3 | 4;
}

export const WORKSPACE_DOMAIN = 'onpango.com';
export const WORKSPACE_SLUG_MAX = 30;
/** 3–30 chars: lowercase letters, digits and hyphens, not starting or ending with a hyphen. */
export const WORKSPACE_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

/** "Distribuidora del Caribe S.A.S." → "distribuidora-del-caribe-s-a-s". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, WORKSPACE_SLUG_MAX);
}

export type WorkspaceStatus =
  | 'empty'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken'
  /** The availability request failed; the server decides on submit. */
  | 'unknown';

interface WorkspaceStatusInput {
  slug: string;
  /** The slug the last availability request was made for (debounced). */
  checkedSlug: string;
  isFetching: boolean;
  isError: boolean;
  available: boolean | undefined;
}

export function getWorkspaceStatus(input: WorkspaceStatusInput): WorkspaceStatus {
  const { slug, checkedSlug, isFetching, isError, available } = input;
  if (!slug) return 'empty';
  if (!WORKSPACE_SLUG_PATTERN.test(slug)) return 'invalid';
  if (slug !== checkedSlug || isFetching) return 'checking';
  if (isError) return 'unknown';
  if (available === undefined) return 'checking';
  return available ? 'available' : 'taken';
}

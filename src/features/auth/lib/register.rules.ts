/** Pure business rules of the registration form (no React, no I/O), so they are easy to test. */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'length',
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH && p.length <= PASSWORD_MAX_LENGTH,
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

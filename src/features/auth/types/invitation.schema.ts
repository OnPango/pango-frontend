import { z } from 'zod';
import { isPasswordValid, PASSWORD_MAX_LENGTH } from '../lib/register.rules';

/**
 * Accept-invitation form. A new email must give a name and choose a password that meets the rules;
 * an existing account only types the password it already has.
 */
export const acceptInvitationSchema = (hasAccount: boolean) =>
  z.object({
    name: hasAccount
      ? z.string()
      : z.string().trim().min(1, 'Escribe tu nombre.').max(120, 'El nombre es demasiado largo.'),
    password: hasAccount
      ? z.string().min(1, 'Escribe tu contraseña.').max(PASSWORD_MAX_LENGTH)
      : z
          .string()
          .min(1, 'Crea una contraseña.')
          .max(PASSWORD_MAX_LENGTH, 'La contraseña es demasiado larga.')
          .refine(isPasswordValid, 'Tu contraseña aún no cumple los requisitos.'),
  });

export type AcceptInvitationValues = { name: string; password: string };

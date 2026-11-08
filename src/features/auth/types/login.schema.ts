import { z } from 'zod';

/** Login form. Only presence is checked: the password rules apply when it is created, not here. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo.')
    .email('Ingresa un correo electrónico válido.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export type LoginValues = z.infer<typeof loginSchema>;

import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

/** CU-13 / US-001: the organization and its first administrator, in one form. */
export const registerOrganizationSchema = z
  .object({
    organizationName: z
      .string()
      .trim()
      .min(1, 'Ingresa el nombre de la organización.')
      .max(120, 'El nombre es demasiado largo.'),
    taxId: z
      .string()
      .trim()
      .min(1, 'Ingresa el identificador tributario.')
      .max(30, 'El identificador tributario es demasiado largo.'),
    contactPhone: z
      .string()
      .trim()
      .min(1, 'Ingresa un teléfono de contacto.')
      .regex(/^[+()\d\s-]{7,20}$/, 'Ingresa un teléfono válido.'),
    adminName: z
      .string()
      .trim()
      .min(1, 'Ingresa el nombre del administrador.')
      .max(120, 'El nombre es demasiado largo.'),
    adminEmail: z
      .string()
      .trim()
      .min(1, 'Ingresa el correo electrónico.')
      .pipe(z.email('Ingresa un correo electrónico válido.')),
    password: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
      ),
    confirmPassword: z.string().min(1, 'Confirma la contraseña.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });

export type RegisterOrganizationValues = z.infer<typeof registerOrganizationSchema>;

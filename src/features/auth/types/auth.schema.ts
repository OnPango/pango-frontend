import { z } from 'zod';
import { isPasswordValid, WORKSPACE_SLUG_PATTERN } from '../lib/register.rules';

/** Step 1 of the registration: the person who becomes the organization's administrator. */
export const accountStepSchema = z.object({
  adminName: z
    .string()
    .trim()
    .min(1, 'Escribe tu nombre.')
    .max(120, 'El nombre es demasiado largo.'),
  adminEmail: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo de trabajo.')
    .pipe(z.email('Ingresa un correo electrónico válido.')),
  password: z
    .string()
    .min(1, 'Crea una contraseña.')
    .refine(isPasswordValid, 'Tu contraseña aún no cumple los requisitos.'),
  acceptTerms: z.boolean().refine((accepted) => accepted, 'Acepta los términos para continuar.'),
});

/** Step 2: the organization and its isolated workspace. Optional fields stay `''` when left empty. */
export const companyStepSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de tu empresa.')
    .max(120, 'El nombre es demasiado largo.'),
  workspaceSlug: z
    .string()
    .min(1, 'Elige una dirección para tu espacio.')
    .regex(
      WORKSPACE_SLUG_PATTERN,
      'Usa de 3 a 30 caracteres: minúsculas, números y guiones, sin terminar en guion.',
    ),
  taxId: z.string().trim().max(30, 'El identificador tributario es demasiado largo.'),
  sector: z.string().min(1, 'Selecciona el sector.'),
  teamSize: z.string().min(1, 'Selecciona el tamaño del equipo.'),
  itemsRange: z.string(),
  country: z.string().min(1, 'Selecciona el país.'),
  city: z.string().trim().max(80, 'El nombre de la ciudad es demasiado largo.'),
  contactPhone: z
    .string()
    .trim()
    .refine(
      (phone) => phone === '' || /^[+()\d\s-]{7,20}$/.test(phone),
      'Ingresa un teléfono válido.',
    ),
});

export const registerOrganizationSchema = accountStepSchema.extend(companyStepSchema.shape);

export type RegisterOrganizationValues = z.infer<typeof registerOrganizationSchema>;

/** Fields validated when leaving step 1. */
export const ACCOUNT_STEP_FIELDS = [
  'adminName',
  'adminEmail',
  'password',
  'acceptTerms',
] as const satisfies readonly (keyof RegisterOrganizationValues)[];

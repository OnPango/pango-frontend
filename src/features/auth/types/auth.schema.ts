import { z } from 'zod';
import { isValidSubdomain, SUBDOMAIN_MAX_LENGTH } from '@/core/tenant/tenant';
import { isPasswordValid, PASSWORD_MAX_LENGTH } from '../lib/register.rules';

/** Step 1 of the sign-up: the person who becomes the organization's owner. */
export const accountStepSchema = z.object({
  name: z.string().trim().min(1, 'Escribe tu nombre.').max(120, 'El nombre es demasiado largo.'),
  email: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo de trabajo.')
    .email('Ingresa un correo electrónico válido.')
    .max(150, 'El correo es demasiado largo.'),
  password: z
    .string()
    .min(1, 'Crea una contraseña.')
    .max(PASSWORD_MAX_LENGTH, 'La contraseña es demasiado larga.')
    .refine(isPasswordValid, 'Tu contraseña aún no cumple los requisitos.'),
  acceptTerms: z.boolean().refine((accepted) => accepted, 'Acepta los términos para continuar.'),
});

/** Step 2: the organization and its subdomain. Optional fields stay `''` when left empty. */
export const companyStepSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre de tu empresa.')
    .max(150, 'El nombre es demasiado largo.'),
  subdomain: z
    .string()
    .min(1, 'Elige una dirección para tu espacio.')
    .max(SUBDOMAIN_MAX_LENGTH, 'La dirección es demasiado larga.')
    .refine(
      isValidSubdomain,
      `Usa de 2 a ${SUBDOMAIN_MAX_LENGTH} caracteres: minúsculas, números y guiones, sin empezar ni terminar en guion. Algunos nombres están reservados.`,
    ),
  taxId: z.string().trim().max(20, 'El identificador tributario es demasiado largo.'),
  businessSector: z.string().min(1, 'Selecciona el sector.'),
  teamSize: z.string().min(1, 'Selecciona el tamaño del equipo.'),
  productCount: z.string().min(1, 'Selecciona cuántos productos manejas.'),
  country: z.string().min(1, 'Selecciona el país.'),
  city: z
    .string()
    .trim()
    .min(1, 'Escribe la ciudad.')
    .max(100, 'El nombre de la ciudad es demasiado largo.'),
  contactPhone: z
    .string()
    .trim()
    .refine(
      (phone) => phone === '' || /^\+?[0-9 ()-]{7,20}$/.test(phone),
      'Ingresa un teléfono válido.',
    ),
});

export const registerOrganizationSchema = accountStepSchema.extend(companyStepSchema.shape);

export type RegisterOrganizationValues = z.infer<typeof registerOrganizationSchema>;

/** Fields validated when leaving step 1. */
export const ACCOUNT_STEP_FIELDS = [
  'name',
  'email',
  'password',
  'acceptTerms',
] as const satisfies readonly (keyof RegisterOrganizationValues)[];

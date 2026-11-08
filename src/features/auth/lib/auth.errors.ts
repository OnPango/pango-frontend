import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish copy for the backend's stable error codes (`docs/auth.md` in pango-core). */
const MESSAGES: Record<string, string> = {
  TENANT_REQUIRED: 'Indica el espacio de tu organización para continuar.',
  ORGANIZATION_NOT_FOUND: 'No encontramos ese espacio. Revisa la dirección.',
  ORGANIZATION_INACTIVE: 'Este espacio no está activo. Contacta al administrador.',
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_NOT_VERIFIED: 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  NOT_A_MEMBER: 'Este usuario no pertenece a esta organización.',
  MEMBERSHIP_SUSPENDED: 'Tu acceso a esta organización está suspendido.',
  ACCOUNT_DISABLED: 'Esta cuenta está deshabilitada.',
  USER_DISABLED: 'Tu usuario está deshabilitado en esta organización.',
  VERIFICATION_TOKEN_INVALID: 'Este enlace de confirmación no es válido, ya se usó o venció.',
  INVITATION_INVALID: 'Esta invitación no es válida, ya se usó o venció.',
  NAME_REQUIRED: 'Escribe tu nombre para crear tu cuenta.',
  TENANT_MISMATCH: 'Este enlace pertenece a otra organización.',
  EMAIL_TAKEN:
    'Ya existe una cuenta con este correo. Escribe su contraseña actual para crear otra organización con ella.',
  SUBDOMAIN_INVALID: 'Esa dirección no está permitida. Elige otra.',
  SUBDOMAIN_TAKEN: 'Esa dirección ya está en uso. Elige otra.',
  TAX_ID_TAKEN: 'Ya existe una organización con ese identificador tributario.',
};

/** Message for a failed auth request: the code's Spanish copy, else the server's text, else `fallback`. */
export function getAuthErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';

/** Spanish text for the stable error codes of the users and invitations endpoints. */
const MESSAGES: Record<string, string> = {
  LAST_ADMIN: 'La organización debe conservar al menos un administrador activo.',
  SELF_DEACTIVATION: 'No puedes desactivar tu propio usuario.',
  FORBIDDEN: 'No tienes permiso para esta operación, o el usuario es administrador.',
  USER_NOT_FOUND: 'El usuario ya no existe.',
  ROLE_NOT_FOUND: 'El rol seleccionado no existe.',
  WAREHOUSE_NOT_FOUND: 'El almacén seleccionado no existe o está inactivo.',
  DEPARTMENT_NOT_FOUND: 'El departamento no existe o está inactivo.',
  DUPLICATE_ROLE_ASSIGNMENT: 'El mismo rol está asignado dos veces sobre el mismo almacén.',
  ALREADY_MEMBER: 'Esa persona ya pertenece a la organización.',
  MAIL_DELIVERY_FAILED: 'No se pudo enviar el correo de la invitación. Intenta de nuevo.',
  INVITATION_NOT_FOUND: 'La invitación ya no existe.',
  ROLE_SYSTEM_LOCKED: 'El rol de Propietario no se puede modificar.',
  ROLE_NAME_TAKEN: 'Ya existe un rol con ese nombre.',
  ROLE_IN_USE: 'El rol está asignado a personas o invitaciones.',
  PERMISSION_NOT_FOUND: 'Alguno de los permisos ya no existe. Recarga la página.',
  ROLE_EXCEEDS_YOUR_PERMISSIONS: 'No puedes darle a un rol permisos que tú no tienes.',
  ROLE_HELD_BY_YOU: 'No puedes editar un rol que tú mismo tienes asignado.',
};

/** Message for a failed users / invitations request: the known code's text, else the API's. */
export function usersErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  return (code && MESSAGES[code]) || getApiErrorMessage(error, fallback);
}

import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Modal } from '@/shared/ui/components/Modal';
import { useDeleteRole } from '../api/users.queries';
import { roleLabel } from '../content/roleLabels';
import { usersErrorMessage } from '../content/users.errors';
import type { ManagedRole } from '../types/users.types';

/** Confirms deleting a role, or says what keeps it from being deleted. It cannot be undone. */
export function DeleteRoleDialog({
  role,
  blocker,
  hasDraft,
  onClose,
  onDeleted,
}: {
  role: ManagedRole;
  /** Why the role cannot be deleted yet (people or invitations hold it); null: it can. */
  blocker: string | null;
  /** The role has permission changes that were not saved: they are lost too. */
  hasDraft: boolean;
  onClose: () => void;
  onDeleted: (role: ManagedRole) => void;
}) {
  const remove = useDeleteRole();
  const name = roleLabel(role.name);

  return (
    <Modal
      title={blocker ? `Todavía no puedes eliminar «${name}»` : `¿Eliminar el rol «${name}»?`}
      size="sm"
      onClose={onClose}
      dismissible={!remove.isPending}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={remove.isPending}>
            {blocker ? 'Entendido' : 'Cancelar'}
          </Button>
          {!blocker && (
            <Button
              variant="danger"
              isLoading={remove.isPending}
              onClick={() => remove.mutate(role.id, { onSuccess: () => onDeleted(role) })}
            >
              Eliminar rol
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-sm">
        {remove.isError && (
          <Alert tone="danger">
            {usersErrorMessage(remove.error, 'No se pudo eliminar el rol.')}
          </Alert>
        )}
        {blocker ? (
          <p>{blocker}</p>
        ) : (
          <p>Nadie lo tiene asignado. Se elimina con sus permisos y no se puede deshacer.</p>
        )}
        {!blocker && hasDraft && (
          <p className="text-fg/90">Los cambios de permisos que no guardaste también se pierden.</p>
        )}
      </div>
    </Modal>
  );
}

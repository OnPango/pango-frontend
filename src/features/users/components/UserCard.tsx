import { MdEdit } from 'react-icons/md';
import { Avatar } from '@/shared/ui/components/Avatar';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { EntityCard } from '@/shared/ui/components/EntityCard';
import { Spinner } from '@/shared/ui/components/Spinner';
import { roleLabel } from '../content/roleLabels';
import type { UserListItem } from '../types/users.types';
import { formatDate, type UsersTableActions } from './usersTable.columns';

export interface UserCardProps extends UsersTableActions {
  item: UserListItem;
}

/** Clean card for a user or a pending invitation, with roles, status, and management actions. */
export function UserCard({
  item,
  currentUserId,
  warehouses,
  canManage,
  onEdit,
  onToggleStatus,
  onResendInvitation,
  onRevokeInvitation,
  togglingUserId = null,
  busyInvitationId = null,
}: UserCardProps) {
  if (item.kind === 'invitation') {
    const { invitation } = item;
    const busy = busyInvitationId === invitation.id;
    const warehouseName = invitation.warehouseId
      ? (warehouses.find((w) => w.id === invitation.warehouseId)?.name ?? 'Almacén')
      : null;

    return (
      <EntityCard
        avatar={
          <Avatar name={invitation.email} size="md" tone="neutral" appearance="soft" decorative />
        }
        title={invitation.email}
        subtitle={`Invitó ${invitation.invitedBy}`}
        badge={
          invitation.expired ? (
            <Badge tone="danger" dot>
              Invitación vencida
            </Badge>
          ) : (
            <Badge tone="warning" dot>
              Invitado
            </Badge>
          )
        }
        footer={
          canManage ? (
            <div className="flex w-full items-center justify-end gap-1">
              {busy && <Spinner className="size-3" />}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onResendInvitation(invitation)}
                className="text-xs"
                aria-label={`Reenviar la invitación a ${invitation.email}`}
              >
                Reenviar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onRevokeInvitation(invitation)}
                className="text-xs text-danger hover:bg-danger/10"
                aria-label={`Revocar la invitación a ${invitation.email}`}
              >
                Revocar
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge appearance="outline" className="rounded-lg font-medium">
            {roleLabel(invitation.roleName)}
            {warehouseName && ` · ${warehouseName}`}
          </Badge>
        </div>
        <p className="text-xs font-light text-muted">
          {invitation.expired ? 'Invitación vencida' : `Vence ${formatDate(invitation.expiresAt)}`}
        </p>
      </EntityCard>
    );
  }

  const { user } = item;
  const isToggling = togglingUserId === user.id;
  const isSelf = user.id === currentUserId;

  return (
    <EntityCard
      avatar={<Avatar name={user.name} size="md" tone="primary" appearance="soft" decorative />}
      title={
        <>
          {user.name}
          {isSelf && <span className="ml-1.5 text-xs font-normal text-muted">(tú)</span>}
        </>
      }
      subtitle={user.email}
      badge={
        <Badge tone={user.isActive ? 'success' : 'danger'} dot>
          {user.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      }
      footer={
        canManage ? (
          <div className="flex w-full items-center justify-end gap-1">
            <Button
              type="button"
              variant={user.isActive ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => onToggleStatus(user)}
              disabled={isToggling || (isSelf && user.isActive)}
              className={`text-xs ${
                user.isActive
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-success hover:bg-success/10'
              }`}
              aria-label={user.isActive ? `Desactivar a ${user.name}` : `Activar a ${user.name}`}
              title={
                isSelf && user.isActive
                  ? 'No puedes desactivar tu propio usuario'
                  : user.isActive
                    ? 'Desactivar acceso'
                    : 'Activar acceso'
              }
            >
              {isToggling ? (
                <Spinner className="size-3" />
              ) : user.isActive ? (
                'Desactivar'
              ) : (
                'Activar'
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(user)}
              className="gap-1.5 p-1.5 text-muted hover:text-fg"
              aria-label={`Editar ${user.name}`}
              title="Editar cargo y roles"
            >
              Editar
              <MdEdit aria-hidden className="size-4" />
            </Button>
          </div>
        ) : undefined
      }
    >
      <p className="text-xs text-muted">
        {user.jobTitle ?? 'Sin cargo'} · {user.department?.name ?? 'Sin departamento'}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {user.roles.map((role) => (
          <Badge
            key={`${role.roleId}-${role.warehouse?.id ?? 'all'}`}
            appearance="outline"
            tone={role.isSystem ? 'primary' : 'neutral'}
            className="rounded-lg font-medium"
          >
            {roleLabel(role.roleName)}
            {role.warehouse && ` · ${role.warehouse.name}`}
          </Badge>
        ))}
      </div>
      <p className="text-xs font-light text-muted">Ingreso: {formatDate(user.joinedAt)}</p>
    </EntityCard>
  );
}

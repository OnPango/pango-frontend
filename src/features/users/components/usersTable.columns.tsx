import { MdEdit } from 'react-icons/md';
import type { Column } from '@/shared/types/dataTable';
import { Avatar } from '@/shared/ui/components/Avatar';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Spinner } from '@/shared/ui/components/Spinner';
import { roleLabel } from '../content/roleLabels';
import type {
  ManagedUser,
  PendingInvitation,
  UserListItem,
  WarehouseOption,
} from '../types/users.types';

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Pendiente';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export interface UsersTableActions {
  /** Id of the signed-in user: they cannot deactivate themselves. */
  currentUserId?: string;
  /** Names the warehouse an invitation is scoped to (invitations only carry its id). */
  warehouses: WarehouseOption[];
  /** Editing, (de)activating and handling invitations need `user.manage`; with only `user.read` the table is read-only. */
  canManage: boolean;
  onEdit: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  onResendInvitation: (invitation: PendingInvitation) => void;
  onRevokeInvitation: (invitation: PendingInvitation) => void;
  /** Id of the user whose status change is in flight; only that row shows the spinner. */
  togglingUserId?: string | null;
  /** Id of the invitation being resent / revoked. */
  busyInvitationId?: string | null;
}

export function getUsersTableColumns({
  currentUserId,
  warehouses,
  canManage,
  onEdit,
  onToggleStatus,
  onResendInvitation,
  onRevokeInvitation,
  togglingUserId = null,
  busyInvitationId = null,
}: UsersTableActions): Column<UserListItem>[] {
  const columns: Column<UserListItem>[] = [
    {
      key: 'person',
      header: 'Persona',
      cell: (item) =>
        item.kind === 'user' ? (
          <div className="flex items-center gap-3">
            <Avatar name={item.user.name} size="md" tone="primary" appearance="soft" decorative />
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg">
                {item.user.name}
                {item.user.id === currentUserId && (
                  <span className="ml-1.5 text-xs text-muted">(tú)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted">{item.user.email}</p>
              {item.user.jobTitle && (
                <p className="truncate text-xs text-muted">{item.user.jobTitle}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar
              name={item.invitation.email}
              size="md"
              tone="neutral"
              appearance="soft"
              decorative
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-fg">{item.invitation.email}</p>
              <p className="truncate text-xs text-muted">Invitó {item.invitation.invitedBy}</p>
            </div>
          </div>
        ),
    },
    {
      key: 'roles',
      header: 'Roles',
      cell: (item) =>
        item.kind === 'user' ? (
          <div className="flex flex-wrap gap-1.5">
            {item.user.roles.map((role) => (
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
        ) : (
          <Badge appearance="outline" className="rounded-lg font-medium">
            {roleLabel(item.invitation.roleName)}
            {item.invitation.warehouseId &&
              ` · ${warehouses.find((w) => w.id === item.invitation.warehouseId)?.name ?? 'Almacén'}`}
          </Badge>
        ),
    },
    {
      key: 'department',
      header: 'Departamento',
      cell: (item) => (
        <span className="text-xs font-medium text-fg/90">
          {(item.kind === 'user' && item.user.department?.name) || '—'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Ingreso',
      cell: (item) => (
        <span className="text-xs font-light text-muted">
          {item.kind === 'user'
            ? formatDate(item.user.joinedAt)
            : item.invitation.expired
              ? '—'
              : `Vence ${formatDate(item.invitation.expiresAt)}`}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (item) => {
        if (item.kind === 'invitation') {
          return item.invitation.expired ? (
            <Badge tone="danger" dot>
              Invitación vencida
            </Badge>
          ) : (
            <Badge tone="warning" dot>
              Invitado
            </Badge>
          );
        }
        return (
          <Badge tone={item.user.isActive ? 'success' : 'danger'} dot>
            {item.user.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        );
      },
    },
  ];

  if (!canManage) return columns;

  return [
    ...columns,
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cell: (item) => {
        if (item.kind === 'invitation') {
          const busy = busyInvitationId === item.invitation.id;
          return (
            <div className="flex w-full items-center justify-end gap-1">
              {busy && <Spinner className="size-3" />}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onResendInvitation(item.invitation)}
                className="text-xs"
                aria-label={`Reenviar la invitación a ${item.invitation.email}`}
              >
                Reenviar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onRevokeInvitation(item.invitation)}
                className="text-xs text-danger hover:bg-danger/10"
                aria-label={`Revocar la invitación a ${item.invitation.email}`}
              >
                Revocar
              </Button>
            </div>
          );
        }

        const { user } = item;
        const isToggling = togglingUserId === user.id;
        const isSelf = user.id === currentUserId;
        return (
          <div className="flex w-full items-center justify-end">
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
          </div>
        );
      },
    },
    {
      key: 'edit',
      header: '',
      className: 'flex justify-end',
      cell: (item) =>
        item.kind === 'user' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item.user)}
            className="flex items-center justify-between gap-2 p-1.5 text-muted hover:text-fg"
            aria-label={`Editar ${item.user.name}`}
            title="Editar cargo y roles"
          >
            <p className="text-md">Editar</p>
            <MdEdit className="size-4" />
          </Button>
        ) : null,
    },
  ];
}

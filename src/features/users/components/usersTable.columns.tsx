import { MdEdit } from 'react-icons/md';
import type { Column } from '@/shared/types/dataTable';
import { Avatar } from '@/shared/ui/components/Avatar';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Spinner } from '@/shared/ui/components/Spinner';
import type { ManagedUser } from '../types/users.types';

export function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return 'Sin registro';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export interface UsersTableActions {
  onEdit: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  /** Id of the user whose status change is in flight; only that row shows the spinner. */
  togglingUserId?: string | null;
}

export function getUsersTableColumns({
  onEdit,
  onToggleStatus,
  togglingUserId = null,
}: UsersTableActions): Column<ManagedUser>[] {
  return [
    {
      key: 'person',
      header: 'Persona',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="md" tone="primary" appearance="soft" decorative />
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{row.name}</p>
            <p className="truncate text-xs text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (row) => (
        <Badge appearance="outline" className="rounded-lg font-medium">
          {row.roleName}
        </Badge>
      ),
    },
    {
      key: 'area',
      header: 'Área',
      cell: (row) => <span className="text-xs font-medium text-fg/90">{row.areaName}</span>,
    },
    {
      key: 'lastLogin',
      header: 'Último ingreso',
      cell: (row) => (
        <span className="text-xs font-light text-muted">{formatLastLogin(row.lastLoginAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (row) => (
        <Badge tone={row.isActive ? 'success' : 'danger'} dot>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cell: (row) => {
        const isToggling = togglingUserId === row.id;
        return (
          <div className="flex w-full items-center justify-end">
            <Button
              type="button"
              variant={row.isActive ? 'ghost' : 'outline'}
              size="sm"
              onClick={() => onToggleStatus(row)}
              disabled={isToggling}
              className={`text-xs ${
                row.isActive ? 'text-danger hover:bg-danger/10' : 'text-success hover:bg-success/10'
              }`}
              aria-label={row.isActive ? `Desactivar a ${row.name}` : `Activar a ${row.name}`}
              title={row.isActive ? 'Desactivar acceso' : 'Activar acceso'}
            >
              {isToggling ? (
                <Spinner className="size-3" />
              ) : row.isActive ? (
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
      key: 'Edit',
      header: '',
      className: 'flex justify-end',
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEdit(row)}
          className="flex items-center justify-between gap-2 p-1.5 text-muted hover:text-fg"
          aria-label={`Editar ${row.name}`}
          title="Editar datos del usuario"
        >
          <p className="text-md">Editar</p>
          <MdEdit className="size-4" />
        </Button>
      ),
    },
  ];
}

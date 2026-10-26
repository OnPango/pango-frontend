import { useState } from 'react';
import { BsShieldCheck } from 'react-icons/bs';
import { FiPlus } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { getApiErrorMessage } from '@/core/api';
import { Button } from '@/shared/ui/components/Button';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useRoles } from '../api/users.queries';
import { RoleModal } from '../components/RoleModal';
import { PERMISSION_DEFINITIONS, type ManagedRole } from '../types/users.types';

export default function RolesPermissionsPage() {
  const { data: roles = [], isLoading, error: queryError } = useRoles();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<ManagedRole | null>(null);

  const handleOpenCreate = () => {
    setRoleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: ManagedRole) => {
    setRoleToEdit(role);
    setIsModalOpen(true);
  };

  const getPermissionLabel = (key: string) => {
    const meta = PERMISSION_DEFINITIONS.find((p) => p.key === key);
    return meta?.label ?? key;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Roles y Permisos"
        subtitle="Define y asigna permisos granulares a los diferentes perfiles del sistema."
        onAction={handleOpenCreate}
        icon={FiPlus}
        actionText="Nuevo Rol"
      />

      {queryError && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {getApiErrorMessage(queryError, 'No se pudieron cargar los roles.')}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted">
          Cargando roles y permisos…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {roles.map((role) => {
            const isAdminRole = role.id === 'role-admin';

            return (
              <div
                key={role.id}
                className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 shadow-xs transition-all hover:border-line2"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-line2 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <BsShieldCheck className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-fg">{role.name}</h3>
                          {isAdminRole && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                              Sistema
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted">
                          {role.description || 'Sin descripción'}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(role)}
                      className="p-2 text-muted hover:text-fg"
                      aria-label={`Editar rol ${role.name}`}
                      title="Editar rol y permisos"
                    >
                      <MdEdit className="size-4" />
                    </Button>
                  </div>

                  <div className="py-4">
                    <div className="mb-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-fg">
                        Permisos asignados ({role.permissions.length})
                      </span>
                      <span className="text-muted">
                        {role.usersCount} {role.usersCount === 1 ? 'usuario' : 'usuarios'}
                      </span>
                    </div>

                    <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
                      {role.permissions.map((permKey) => (
                        <span
                          key={permKey}
                          className="inline-flex items-center rounded-lg border border-line2 bg-canvas px-2.5 py-1 text-[11px] font-medium text-fg"
                        >
                          {getPermissionLabel(permKey)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-line2 pt-3 text-xs text-muted">
                  <span>Identificador: {role.id}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(role)}
                    className="cursor-pointer font-medium text-primary hover:underline"
                  >
                    Modificar permisos →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Create / Edit Modal */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roleToEdit={roleToEdit}
      />
    </div>
  );
}

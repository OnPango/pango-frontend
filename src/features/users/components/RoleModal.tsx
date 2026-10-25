import { useState, type FormEvent } from 'react';
import { IoClose } from 'react-icons/io5';
import { getApiErrorMessage } from '@/core/api';
import type { Permission } from '@/core/auth/user';
import { Button } from '@/shared/ui/components/Button';
import { useCreateRole, useUpdateRole } from '../api/users.queries';
import {
  PERMISSION_DEFINITIONS,
  type ManagedRole,
  type PermissionMeta,
} from '../types/users.types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit: ManagedRole | null;
}

interface RoleModalContentProps {
  onClose: () => void;
  roleToEdit: ManagedRole | null;
}

function RoleModalContent({ onClose, roleToEdit }: RoleModalContentProps) {
  const isEditing = !!roleToEdit;
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const [name, setName] = useState(roleToEdit?.name ?? '');
  const [description, setDescription] = useState(roleToEdit?.description ?? '');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    roleToEdit?.permissions ?? ['dashboard:view'],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPending = createRole.isPending || updateRole.isPending;

  const togglePermission = (key: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'operations', label: 'Operaciones e Inventario' },
    { id: 'supply', label: 'Abastecimiento y Proveedores' },
    { id: 'admin', label: 'Administración' },
  ] as const;

  const getPermissionsByCategory = (cat: string): PermissionMeta[] =>
    PERMISSION_DEFINITIONS.filter((p) => p.category === cat);

  const toggleCategory = (cat: string) => {
    const catPerms = getPermissionsByCategory(cat).map((p) => p.key);
    const allSelected = catPerms.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !catPerms.includes(k)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...catPerms])));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedPermissions.length === 0) {
      setErrorMessage('Debes seleccionar al menos un permiso para el rol.');
      return;
    }

    if (isEditing && roleToEdit) {
      updateRole.mutate(
        {
          id: roleToEdit.id,
          name,
          description,
          permissions: selectedPermissions,
        },
        {
          onSuccess: () => onClose(),
          onError: (err) =>
            setErrorMessage(getApiErrorMessage(err, 'No se pudo actualizar el rol.')),
        },
      );
    } else {
      createRole.mutate(
        {
          name,
          description,
          permissions: selectedPermissions,
        },
        {
          onSuccess: () => onClose(),
          onError: (err) => setErrorMessage(getApiErrorMessage(err, 'No se pudo crear el rol.')),
        },
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-fg/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-line bg-surface p-6 shadow-2xl transition-all sm:p-8">
        <div className="flex shrink-0 items-center justify-between border-b border-line pb-4">
          <div>
            <h2 id="role-modal-title" className="text-xl font-bold text-fg">
              {isEditing ? 'Editar Rol y Permisos' : 'Crear Nuevo Rol'}
            </h2>
            <p className="text-xs text-muted">
              Define los privilegios de acceso y visibilidad de las funciones del sistema.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-fg/5 hover:text-fg focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden"
            aria-label="Cerrar ventana"
          >
            <IoClose className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="role-name" className="mb-1.5 block text-xs font-semibold text-fg">
              Nombre del rol <span className="text-danger">*</span>
            </label>
            <input
              id="role-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Auditor de Calidad"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="role-description"
              className="mb-1.5 block text-xs font-semibold text-fg"
            >
              Descripción
            </label>
            <input
              id="role-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve detalle de las responsabilidades asociadas"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs font-semibold text-fg">
                Permisos del sistema <span className="text-danger">*</span> (
                {selectedPermissions.length} seleccionados)
              </label>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const perms = getPermissionsByCategory(cat.id);
                const allSelected = perms.every((p) => selectedPermissions.includes(p.key));

                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl border border-line bg-surface/60 p-4 transition-colors"
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-line2 pb-2">
                      <span className="text-xs font-bold tracking-wider text-primary uppercase">
                        {cat.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className="cursor-pointer text-xs font-semibold text-accent hover:underline"
                      >
                        {allSelected ? 'Desmarcar todos' : 'Seleccionar todos'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {perms.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition-all ${
                              isChecked
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-line bg-surface hover:border-line2'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.key)}
                              className="mt-0.5 size-4 rounded-md border-line text-primary focus:ring-primary/50"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-tight font-semibold text-fg">
                                {perm.label}
                              </p>
                              {perm.description && (
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
              {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RoleModal({ isOpen, onClose, roleToEdit }: RoleModalProps) {
  if (!isOpen) return null;

  return (
    <RoleModalContent key={roleToEdit?.id ?? 'create'} onClose={onClose} roleToEdit={roleToEdit} />
  );
}

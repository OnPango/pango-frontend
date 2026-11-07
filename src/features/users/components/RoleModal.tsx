import { useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/core/api';
import type { Permission } from '@/core/auth/user';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Checkbox } from '@/shared/ui/components/form/Checkbox';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useCreateRole, useUpdateRole } from '../api/users.queries';
import {
  PERMISSION_CATALOG,
  PERMISSION_CATEGORIES,
  PERMISSIONS_BY_CATEGORY,
  type PermissionCategoryId,
} from '../content/permissions.catalog';
import type { ManagedRole } from '../types/users.types';

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
    roleToEdit?.permissions ?? [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPending = createRole.isPending || updateRole.isPending;

  const togglePermission = (key: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  };

  const toggleCategory = (cat: PermissionCategoryId) => {
    const catPerms = PERMISSIONS_BY_CATEGORY[cat];
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

  const formId = 'role-form';

  return (
    <Modal
      size="lg"
      title={isEditing ? 'Editar Rol y Permisos' : 'Crear Nuevo Rol'}
      description="Define los privilegios de acceso y visibilidad de las funciones del sistema."
      onClose={onClose}
      dismissible={!isPending}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="primary" size="sm" isLoading={isPending}>
            {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

        <TextBox
          label="Nombre del rol"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Auditor de Calidad"
        />

        <TextBox
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve detalle de las responsabilidades asociadas"
        />

        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-semibold text-fg">
            Permisos del sistema <span className="text-danger">*</span> (
            {selectedPermissions.length} seleccionados)
          </legend>

          <div className="space-y-4">
            {PERMISSION_CATEGORIES.map((cat) => {
              const perms = PERMISSIONS_BY_CATEGORY[cat.id];
              const allSelected = perms.every((key) => selectedPermissions.includes(key));

              return (
                <div key={cat.id} className="rounded-2xl border border-line2 p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-line2 pb-2">
                    <span className="text-xs font-bold tracking-wider text-primary uppercase">
                      {cat.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="cursor-pointer text-xs font-semibold text-primary hover:underline"
                    >
                      {allSelected ? 'Desmarcar todos' : 'Seleccionar todos'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {perms.map((key) => {
                      const perm = PERMISSION_CATALOG[key];
                      return (
                        <Checkbox
                          key={key}
                          label={perm.label}
                          description={perm.description}
                          checked={selectedPermissions.includes(key)}
                          onChange={() => togglePermission(key)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export function RoleModal({ isOpen, onClose, roleToEdit }: RoleModalProps) {
  if (!isOpen) return null;

  return (
    <RoleModalContent key={roleToEdit?.id ?? 'create'} onClose={onClose} roleToEdit={roleToEdit} />
  );
}

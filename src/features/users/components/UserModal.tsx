import { useState, type FormEvent } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { roleLabel } from '../content/roleLabels';
import { usersErrorMessage } from '../content/users.errors';
import type {
  ChangeUserRolesInput,
  ManagedUser,
  RoleOption,
  WarehouseOption,
} from '../types/users.types';

/** What the modal changed; a field is absent when it was left as it was. */
export interface UserChanges {
  jobTitle?: string | null;
  roles?: Pick<ChangeUserRolesInput, 'add' | 'remove'>;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ManagedUser | null;
  roles: RoleOption[];
  warehouses: WarehouseOption[];
  /** Rejects on failure: the modal shows the error and stays open. */
  onSave: (user: ManagedUser, changes: UserChanges) => Promise<void>;
  isSubmitting?: boolean;
}

/** "Every warehouse" in the select (a real id is never this). */
const ALL_WAREHOUSES = 'all';

interface Row {
  key: number;
  roleId: string;
  /** A warehouse id, `ALL_WAREHOUSES` (system roles) or '' (not chosen yet). */
  warehouseId: string;
}

const toRows = (user: ManagedUser): Row[] =>
  user.roles.map((role, index) => ({
    key: index,
    roleId: role.roleId,
    warehouseId: role.warehouse?.id ?? ALL_WAREHOUSES,
  }));

const assignmentKey = (roleId: string, warehouseId: string) => `${roleId}:${warehouseId}`;

function UserModalContent({
  onClose,
  user,
  roles,
  warehouses,
  onSave,
  isSubmitting = false,
}: Omit<UserModalProps, 'isOpen' | 'user'> & { user: ManagedUser }) {
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? '');
  const [rows, setRows] = useState<Row[]>(() => toRows(user));
  const [nextKey, setNextKey] = useState(rows.length);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
  }));
  const isSystemRole = (roleId: string) => roles.find((role) => role.id === roleId)?.isSystem;
  const roleOptions = roles.map((role) => ({ value: role.id, label: roleLabel(role.name) }));

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  // A system role (Owner) applies to every warehouse; any other role belongs to one warehouse.
  const changeRole = (key: number, roleId: string) =>
    updateRow(key, { roleId, warehouseId: isSystemRole(roleId) ? ALL_WAREHOUSES : '' });

  const addRow = () => {
    setRows((current) => [...current, { key: nextKey, roleId: '', warehouseId: '' }]);
    setNextKey((key) => key + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (rows.length === 0 || rows.some((row) => !row.roleId)) {
      setErrorMessage('Cada asignación necesita un rol. El usuario debe tener al menos una.');
      return;
    }
    if (rows.some((row) => !row.warehouseId)) {
      setErrorMessage('Elige el almacén de cada rol (solo el Propietario aplica a todos).');
      return;
    }
    const seen = new Set(rows.map((row) => assignmentKey(row.roleId, row.warehouseId)));
    if (seen.size !== rows.length) {
      setErrorMessage('El mismo rol no puede asignarse dos veces sobre el mismo almacén.');
      return;
    }

    const changes: UserChanges = {};
    if (jobTitle.trim() !== (user.jobTitle ?? '')) changes.jobTitle = jobTitle.trim() || null;
    const current = new Set(toRows(user).map((row) => assignmentKey(row.roleId, row.warehouseId)));
    const add = rows
      .filter((row) => !current.has(assignmentKey(row.roleId, row.warehouseId)))
      .map((row) => ({
        roleId: row.roleId,
        warehouseId: row.warehouseId === ALL_WAREHOUSES ? null : row.warehouseId,
      }));
    const remove = user.roles
      .filter((role) => !seen.has(assignmentKey(role.roleId, role.warehouse?.id ?? ALL_WAREHOUSES)))
      .map((role) => role.assignmentId);
    if (add.length > 0 || remove.length > 0) changes.roles = { add, remove };
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    try {
      await onSave(user, changes);
    } catch (err) {
      setErrorMessage(usersErrorMessage(err, 'No se pudo actualizar el usuario.'));
    }
  };

  const formId = 'user-form';

  return (
    <Modal
      title="Editar usuario"
      description="Cargo y roles. El nombre y el correo pertenecen a la cuenta de la persona y no se editan aquí."
      size="lg"
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="primary" size="sm" isLoading={isSubmitting}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

        <div className="rounded-2xl border border-line2 bg-canvas px-4 py-3">
          <p className="font-semibold text-fg">{user.name}</p>
          <p className="text-xs text-muted">{user.email}</p>
        </div>

        <TextBox
          label="Cargo"
          value={jobTitle}
          maxLength={80}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Ej. Jefe de bodega"
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-fg">Roles</legend>
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Select
                searchable
                searchPlaceholder="Buscar…"
                emptyMessage="Sin resultados"
                aria-label={`Rol ${index + 1}`}
                value={row.roleId}
                onChange={(roleId) => changeRole(row.key, roleId)}
                placeholder="Selecciona un rol"
                options={roleOptions}
              />
              <Select
                searchable
                searchPlaceholder="Buscar…"
                emptyMessage="Sin resultados"
                aria-label={`Almacén del rol ${index + 1}`}
                value={row.warehouseId}
                onChange={(warehouseId) => updateRow(row.key, { warehouseId })}
                placeholder="Selecciona un almacén"
                options={
                  row.warehouseId === ALL_WAREHOUSES
                    ? [{ value: ALL_WAREHOUSES, label: 'Todos los almacenes' }]
                    : warehouseOptions
                }
                disabled={row.warehouseId === ALL_WAREHOUSES}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                disabled={rows.length === 1}
                aria-label={`Quitar el rol ${index + 1}`}
                title={rows.length === 1 ? 'Debe quedar al menos un rol' : 'Quitar este rol'}
                className="text-danger hover:bg-danger/10"
              >
                <FiTrash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <FiPlus className="mr-1 size-4" /> Añadir rol
          </Button>
        </fieldset>
      </form>
    </Modal>
  );
}

export function UserModal({ isOpen, user, ...props }: UserModalProps) {
  if (!isOpen || !user) return null;
  return <UserModalContent key={user.id} user={user} {...props} />;
}

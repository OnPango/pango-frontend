import { useState, type FormEvent } from 'react';
import { getApiErrorMessage } from '@/core/api/errors';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Switch } from '@/shared/ui/components/form/Switch';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import type {
  CreateUserInput,
  ManagedArea,
  ManagedRole,
  ManagedUser,
  UpdateUserInput,
} from '../types/users.types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: ManagedUser | null;
  roles: ManagedRole[];
  areas: ManagedArea[];
  onCreateUser: (data: CreateUserInput) => Promise<void>;
  onUpdateUser: (data: UpdateUserInput) => Promise<void>;
  isSubmitting?: boolean;
}

interface UserModalContentProps {
  onClose: () => void;
  userToEdit: ManagedUser | null;
  roles: ManagedRole[];
  areas: ManagedArea[];
  onCreateUser: (data: CreateUserInput) => Promise<void>;
  onUpdateUser: (data: UpdateUserInput) => Promise<void>;
  isSubmitting?: boolean;
}

function UserModalContent({
  onClose,
  userToEdit,
  roles,
  areas,
  onCreateUser,
  onUpdateUser,
  isSubmitting = false,
}: UserModalContentProps) {
  const isEditing = !!userToEdit;

  const [name, setName] = useState(userToEdit?.name ?? '');
  const [email, setEmail] = useState(userToEdit?.email ?? '');
  // No default on create: privileges (role) must be an explicit choice, never "whatever is first".
  const [roleId, setRoleId] = useState(userToEdit?.roleId ?? '');
  const [areaId, setAreaId] = useState(userToEdit?.areaId ?? '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(userToEdit?.isActive ?? true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!roleId) {
      setErrorMessage('Debe seleccionar un rol para el usuario.');
      return;
    }
    if (!areaId) {
      setErrorMessage('Debe seleccionar un área de trabajo para el usuario.');
      return;
    }

    try {
      if (isEditing && userToEdit) {
        await onUpdateUser({
          id: userToEdit.id,
          name: name.trim(),
          email: email.trim(),
          roleId,
          areaId,
          isActive,
          password: password ? password : undefined,
        });
      } else {
        await onCreateUser({
          name: name.trim(),
          email: email.trim(),
          roleId,
          areaId,
          password: password ? password : undefined,
        });
      }
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(
          err,
          isEditing ? 'No se pudo actualizar el usuario.' : 'No se pudo crear el usuario.',
        ),
      );
    }
  };

  const formId = 'user-form';

  return (
    <Modal
      title={isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
      description={
        isEditing
          ? 'Actualiza la información de la persona, rol o área asignada.'
          : 'Registra una nueva persona en el sistema con su rol y área.'
      }
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
            {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

        <TextBox
          label="Persona / Nombre completo"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Andrés Morales"
        />

        <TextBox
          label="Correo electrónico"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@pango.co"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Rol asignado"
            required
            value={roleId}
            onChange={setRoleId}
            placeholder="Selecciona un rol"
            options={roles.map((role) => ({ value: role.id, label: role.name }))}
          />
          <Select
            label="Área de trabajo"
            required
            value={areaId}
            onChange={setAreaId}
            placeholder="Selecciona un área"
            options={areas.map((area) => ({ value: area.id, label: area.name }))}
          />
        </div>

        <TextBox
          label={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            isEditing
              ? 'Dejar en blanco para no modificar'
              : 'Dejar en blanco para usar la predeterminada'
          }
        />

        {isEditing && (
          <Switch
            label="Usuario activo en el sistema"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        )}
      </form>
    </Modal>
  );
}

export function UserModal({
  isOpen,
  onClose,
  userToEdit,
  roles,
  areas,
  onCreateUser,
  onUpdateUser,
  isSubmitting,
}: UserModalProps) {
  if (!isOpen) return null;

  return (
    <UserModalContent
      key={userToEdit?.id ?? 'create'}
      onClose={onClose}
      userToEdit={userToEdit}
      roles={roles}
      areas={areas}
      onCreateUser={onCreateUser}
      onUpdateUser={onUpdateUser}
      isSubmitting={isSubmitting}
    />
  );
}

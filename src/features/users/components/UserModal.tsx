import { useState, type FormEvent } from 'react';
import { IoClose } from 'react-icons/io5';
import { getApiErrorMessage } from '@/core/api';
import { Button } from '@/shared/ui/components/Button';
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
  const [roleId, setRoleId] = useState(userToEdit?.roleId ?? roles[0]?.id ?? '');
  const [areaId, setAreaId] = useState(userToEdit?.areaId ?? areas[0]?.id ?? '');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(userToEdit?.isActive ?? true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const targetRoleId = roleId || roles[0]?.id || '';
    const targetAreaId = areaId || areas[0]?.id || '';

    if (!targetRoleId) {
      setErrorMessage('Debe seleccionar un rol para el usuario.');
      return;
    }
    if (!targetAreaId) {
      setErrorMessage('Debe seleccionar un área de trabajo para el usuario.');
      return;
    }

    try {
      if (isEditing && userToEdit) {
        await onUpdateUser({
          id: userToEdit.id,
          name: name.trim(),
          email: email.trim(),
          roleId: targetRoleId,
          areaId: targetAreaId,
          isActive,
          password: password ? password : undefined,
        });
      } else {
        await onCreateUser({
          name: name.trim(),
          email: email.trim(),
          roleId: targetRoleId,
          areaId: targetAreaId,
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-fg/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-2xl transition-all sm:p-8">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 id="user-modal-title" className="text-xl font-bold text-fg">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <p className="text-xs text-muted">
              {isEditing
                ? 'Actualiza la información de la persona, rol o área asignada.'
                : 'Registra una nueva persona en el sistema con su rol y área.'}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-xs text-danger"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="user-name" className="mb-1.5 block text-xs font-semibold text-fg">
              Persona / Nombre completo <span className="text-danger">*</span>
            </label>
            <input
              id="user-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Andrés Morales"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label htmlFor="user-email" className="mb-1.5 block text-xs font-semibold text-fg">
              Correo electrónico <span className="text-danger">*</span>
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@pango.co"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="user-role" className="mb-1.5 block text-xs font-semibold text-fg">
                Rol asignado <span className="text-danger">*</span>
              </label>
              <select
                id="user-role"
                required
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="" disabled>
                  Selecciona un rol
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="user-area" className="mb-1.5 block text-xs font-semibold text-fg">
                Área de trabajo <span className="text-danger">*</span>
              </label>
              <select
                id="user-area"
                required
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="" disabled>
                  Selecciona un área
                </option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="user-password" className="mb-1.5 block text-xs font-semibold text-fg">
              {isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}
            </label>
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isEditing ? 'Dejar en blanco para no modificar' : 'Por defecto: Pango123*'
              }
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-2">
              <input
                id="user-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded-md border-line text-primary focus:ring-primary/50"
              />
              <label htmlFor="user-active" className="text-sm font-medium text-fg">
                Usuario activo en el sistema
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
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

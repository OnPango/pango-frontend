import { useState, type FormEvent } from 'react';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { roleLabel } from '../content/roleLabels';
import { usersErrorMessage } from '../content/users.errors';
import type { InviteUserInput, RoleOption, WarehouseOption } from '../types/users.types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleOption[];
  warehouses: WarehouseOption[];
  /** Rejects on failure: the modal shows the error and stays open. */
  onInvite: (input: InviteUserInput) => Promise<void>;
  isSubmitting?: boolean;
}

const ALL_WAREHOUSES = 'all';

function InviteModalContent({
  onClose,
  roles,
  warehouses,
  onInvite,
  isSubmitting = false,
}: Omit<InviteModalProps, 'isOpen'>) {
  const [email, setEmail] = useState('');
  // No default: privileges (role) must be an explicit choice, never "whatever is first".
  const [roleId, setRoleId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSystemRole = roles.find((role) => role.id === roleId)?.isSystem ?? false;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!roleId) {
      setErrorMessage('Debes seleccionar un rol para la persona invitada.');
      return;
    }
    if (!isSystemRole && !warehouseId) {
      setErrorMessage('Elige el almacén donde aplica el rol (solo el Propietario aplica a todos).');
      return;
    }
    try {
      await onInvite({
        email,
        roleId,
        warehouseId: isSystemRole ? null : warehouseId,
      });
    } catch (err) {
      setErrorMessage(usersErrorMessage(err, 'No se pudo enviar la invitación.'));
    }
  };

  const formId = 'invite-form';

  return (
    <Modal
      title="Invitar usuario"
      description="Le llegará un correo con un enlace para crear su cuenta o unirse a la organización. El enlace vence en 72 horas."
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
            Enviar invitación
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}

        <TextBox
          label="Correo electrónico"
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="persona@empresa.co"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Rol"
            required
            value={roleId}
            onChange={(id) => {
              setRoleId(id);
              setWarehouseId('');
            }}
            placeholder="Selecciona un rol"
            options={roles.map((role) => ({ value: role.id, label: roleLabel(role.name) }))}
          />
          <Select
            label="Almacén"
            required={!isSystemRole}
            value={isSystemRole ? ALL_WAREHOUSES : warehouseId}
            onChange={setWarehouseId}
            placeholder="Selecciona un almacén"
            disabled={isSystemRole}
            options={
              isSystemRole
                ? [{ value: ALL_WAREHOUSES, label: 'Todos los almacenes' }]
                : warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))
            }
          />
        </div>
      </form>
    </Modal>
  );
}

export function InviteModal({ isOpen, ...props }: InviteModalProps) {
  if (!isOpen) return null;
  return <InviteModalContent {...props} />;
}

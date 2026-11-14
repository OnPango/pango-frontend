import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import type { Permission } from '@/core/auth/user';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { TextArea } from '@/shared/ui/components/form/TextArea';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useCreateRole, useUpdateRoleDetails } from '../api/users.queries';
import { roleDescription, roleLabel } from '../content/roleLabels';
import { usersErrorMessage } from '../content/users.errors';
import { roleSchema, type RoleFormValues } from '../types/role.schema';
import type { ManagedRole, UpdateRoleDetailsInput } from '../types/users.types';

const FORM_ID = 'role-form';

const normalized = (name: string) => name.trim().toLocaleLowerCase('es');

interface RoleFormProps {
  /** The role being edited; absent: a new one. */
  role?: ManagedRole;
  /** Every role of the organization: to start from one, and to keep names unique. */
  roles: ManagedRole[];
  /** What the person can give: the Owner gives anything, anyone else only what they hold. */
  grantable: ReadonlySet<Permission> | null;
  onClose: () => void;
  onSaved: (role: ManagedRole) => void;
}

function RoleForm({ role, roles, grantable, onClose, onSaved }: RoleFormProps) {
  const isEdit = role !== undefined;
  const create = useCreateRole();
  const update = useUpdateRoleDetails();
  const mutation = isEdit ? update : create;
  // As the screens show them: a seeded role is saved in Spanish only if the person changes it.
  const currentName = role ? roleLabel(role.name) : '';
  const currentDescription = role ? roleDescription(role.description) : null;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    mode: 'onTouched',
    defaultValues: {
      name: currentName,
      description: currentDescription ?? '',
      copyFrom: '',
    },
  });
  const copyFrom = useWatch({ control, name: 'copyFrom' });

  /** What the new role starts with: the chosen role's permissions that the person can give. */
  const startingPermissions = (id: string): Permission[] => {
    const source = roles.find((candidate) => candidate.id === id);
    if (!source) return [];
    return grantable
      ? source.permissions.filter((permission) => grantable.has(permission))
      : source.permissions;
  };
  const source = roles.find((candidate) => candidate.id === copyFrom);
  const left = source ? source.permissions.length - startingPermissions(source.id).length : 0;

  const onError = (error: unknown) => {
    if (getApiErrorCode(error) === 'ROLE_NAME_TAKEN') {
      setError('name', { message: usersErrorMessage(error, '') }, { shouldFocus: true });
    }
  };

  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    // Names are unique whatever the case, and as the screens show them ("Admin" is "Administrador").
    const taken = roles.some(
      (other) =>
        other.id !== role?.id &&
        (normalized(other.name) === normalized(name) ||
          normalized(roleLabel(other.name)) === normalized(name)),
    );
    if (taken) {
      setError('name', { message: 'Ya existe un rol con ese nombre.' }, { shouldFocus: true });
      return;
    }
    const description = values.description.trim() || null;

    if (!role) {
      create.mutate(
        { name, description, permissions: startingPermissions(values.copyFrom) },
        { onSuccess: onSaved, onError },
      );
      return;
    }
    const changes: UpdateRoleDetailsInput = { id: role.id };
    if (name !== currentName) changes.name = name;
    if (description !== currentDescription) changes.description = description;
    update.mutate(changes, { onSuccess: onSaved, onError });
  });

  const nameError = getApiErrorCode(mutation.error) === 'ROLE_NAME_TAKEN';

  return (
    <Modal
      title={isEdit ? 'Editar rol' : 'Nuevo rol'}
      description={
        isEdit
          ? currentName
          : 'Un rol agrupa permisos. Después de crearlo eliges sus permisos y se lo das a las personas en un almacén.'
      }
      size="sm"
      onClose={onClose}
      dismissible={!mutation.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="sm"
            isLoading={mutation.isPending}
            disabled={isEdit && !isDirty}
          >
            {isEdit ? 'Guardar cambios' : 'Crear rol'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
        {mutation.isError && !nameError && (
          <Alert tone="danger">
            {usersErrorMessage(mutation.error, 'No se pudo guardar el rol.')}
          </Alert>
        )}
        <TextBox
          label="Nombre"
          required
          maxLength={60}
          placeholder="Ej. Auxiliar de bodega"
          hint="Único en la organización."
          error={errors.name?.message}
          {...register('name')}
        />
        <TextArea
          label="Descripción"
          optional
          rows={2}
          maxLength={500}
          placeholder="Ej. Recibe mercancía y registra salidas en su almacén."
          hint="Para que quien asigne el rol sepa para qué es."
          error={errors.description?.message}
          {...register('description')}
        />
        {!isEdit && (
          <FormSelect
            control={control}
            name="copyFrom"
            label="Empezar con los permisos de"
            optional
            clearable
            placeholder="Ningún rol: empieza sin permisos"
            options={roles.map((candidate) => ({
              value: candidate.id,
              label: roleLabel(candidate.name),
              description: `${candidate.permissions.length} ${
                candidate.permissions.length === 1 ? 'permiso' : 'permisos'
              }`,
            }))}
            hint={
              left > 0
                ? `Se copian los que tú tienes: ${left} ${left === 1 ? 'queda' : 'quedan'} fuera.`
                : 'Los podrás cambiar después de crearlo.'
            }
          />
        )}
      </form>
    </Modal>
  );
}

/** "Nuevo rol" and "Editar rol" (name and description; the permissions are edited on the page). */
export function RoleFormModal({
  isOpen,
  role,
  ...props
}: Omit<RoleFormProps, 'role'> & { isOpen: boolean; role?: ManagedRole | null }) {
  if (!isOpen) return null;
  return <RoleForm key={role?.id ?? 'new'} role={role ?? undefined} {...props} />;
}

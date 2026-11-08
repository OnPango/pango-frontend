import { useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { hasAnyPermission } from '@/core/auth/permissions';
import { useAuthStore } from '@/core/auth/auth.store';
import { getApiErrorMessage } from '@/core/api/errors';
import { Alert } from '@/shared/ui/components/Alert';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { usePagination } from '@/shared/ui/components/pagination/usePagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useInvitations,
  useChangeUserRoles,
  useInviteUser,
  useRevokeInvitation,
  useRoleOptions,
  useSetUserActive,
  useUpdateUser,
  useUsers,
  useWarehouses,
} from '../api/users.queries';
import { InviteModal } from '../components/InviteModal';
import { UserModal, type UserChanges } from '../components/UserModal';
import { UsersTable } from '../components/UsersTable';
import { roleLabel } from '../content/roleLabels';
import { usersErrorMessage } from '../content/users.errors';
import type {
  InviteUserInput,
  ManagedUser,
  PendingInvitation,
  UserListItem,
} from '../types/users.types';

type StatusFilter = 'all' | 'active' | 'inactive' | 'invited';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Solo activos' },
  { value: 'inactive', label: 'Solo inactivos' },
  { value: 'invited', label: 'Solo invitados' },
];

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = hasAnyPermission(currentUser, ['user.manage']);

  const { data: users = [], isLoading, error: queryError } = useUsers();
  const {
    data: invitations = [],
    isLoading: invitationsLoading,
    error: invitationsError,
  } = useInvitations();
  const { data: warehouses = [] } = useWarehouses();
  const roles = useRoleOptions();

  const updateUser = useUpdateUser();
  const changeUserRoles = useChangeUserRoles();
  const setUserActive = useSetUserActive();
  const inviteUser = useInviteUser();
  const revokeInvitation = useRevokeInvitation();

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null);

  const roleOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: 'Todos los roles' },
      ...roles.map((role) => ({ value: role.id, label: roleLabel(role.name) })),
    ],
    [roles],
  );

  // There is no departments endpoint yet: the filter offers the ones users already belong to.
  const departmentOptions = useMemo<SelectOption[]>(() => {
    const departments = new Map<string, string>();
    for (const user of users) {
      if (user.department) departments.set(user.department.id, user.department.name);
    }
    return [
      { value: 'all', label: 'Todos los departamentos' },
      ...[...departments].map(([value, label]) => ({ value, label })),
    ];
  }, [users]);

  // Invitations are people who have not joined yet: they share the table, after the users.
  const filteredItems = useMemo<UserListItem[]>(() => {
    const term = search.trim().toLowerCase();
    const matchesSearch = (...fields: string[]) =>
      term === '' || fields.some((field) => field.toLowerCase().includes(term));

    const items: UserListItem[] = [];
    for (const user of users) {
      const matches =
        matchesSearch(user.name, user.email) &&
        (selectedRole === 'all' || user.roles.some((r) => r.roleId === selectedRole)) &&
        (selectedDepartment === 'all' || user.department?.id === selectedDepartment) &&
        (selectedStatus === 'all' ||
          (selectedStatus === 'active' && user.isActive) ||
          (selectedStatus === 'inactive' && !user.isActive));
      if (matches) items.push({ kind: 'user', id: `user-${user.id}`, user });
    }
    // An invitation has no department and is neither active nor inactive.
    if (
      selectedDepartment === 'all' &&
      (selectedStatus === 'all' || selectedStatus === 'invited')
    ) {
      for (const invitation of invitations) {
        const matches =
          matchesSearch(invitation.email) &&
          (selectedRole === 'all' || invitation.roleId === selectedRole);
        if (matches) {
          items.push({ kind: 'invitation', id: `invitation-${invitation.id}`, invitation });
        }
      }
    }
    return items;
  }, [users, invitations, search, selectedRole, selectedDepartment, selectedStatus]);

  const { page, pageSize, totalItems, pageItems, setPage, setPageSize } =
    usePagination<UserListItem>(filteredItems, 10);

  const handleOpenInvite = () => {
    setActionError(null);
    setNotice(null);
    setIsInviteOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setActionError(null);
    setNotice(null);
    setUserToEdit(user);
  };

  // On failure the promise rejects and the modal shows the error itself; the page only closes it on success.
  const handleInvite = async (input: InviteUserInput) => {
    await inviteUser.mutateAsync(input);
    setIsInviteOpen(false);
    setNotice(`Invitación enviada a ${input.email.trim().toLowerCase()}.`);
  };

  const handleSave = async (user: ManagedUser, changes: UserChanges) => {
    if ('jobTitle' in changes) {
      await updateUser.mutateAsync({ id: user.id, jobTitle: changes.jobTitle ?? null });
    }
    if (changes.roles) {
      await changeUserRoles.mutateAsync({ id: user.id, ...changes.roles });
    }
    setUserToEdit(null);
  };

  const handleToggleStatus = (user: ManagedUser) => {
    setActionError(null);
    setNotice(null);
    setUserActive.mutate(
      { id: user.id, isActive: !user.isActive },
      {
        onError: (err) =>
          setActionError(usersErrorMessage(err, 'No fue posible cambiar el estado del usuario.')),
      },
    );
  };

  const handleResend = (invitation: PendingInvitation) => {
    setActionError(null);
    setNotice(null);
    setBusyInvitationId(invitation.id);
    inviteUser.mutate(
      { email: invitation.email, roleId: invitation.roleId, warehouseId: invitation.warehouseId },
      {
        onSuccess: () => setNotice(`Invitación reenviada a ${invitation.email}.`),
        onError: (err) =>
          setActionError(usersErrorMessage(err, 'No se pudo reenviar la invitación.')),
        onSettled: () => setBusyInvitationId(null),
      },
    );
  };

  const handleRevoke = (invitation: PendingInvitation) => {
    setActionError(null);
    setNotice(null);
    setBusyInvitationId(invitation.id);
    revokeInvitation.mutate(invitation.id, {
      onSuccess: () => setNotice(`Invitación a ${invitation.email} revocada.`),
      onError: (err) => setActionError(usersErrorMessage(err, 'No se pudo revocar la invitación.')),
      onSettled: () => setBusyInvitationId(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra las personas de la organización, sus roles y sus invitaciones."
        onAction={canManage ? handleOpenInvite : undefined}
        icon={FiPlus}
        actionText="Invitar usuario"
      />

      {actionError && <Alert tone="danger">{actionError}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TextBox
          type="search"
          aria-label="Buscar usuarios"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo electrónico…"
          leadingIcon={FiSearch}
          containerClassName="flex-1"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filtrar por rol"
            value={selectedRole}
            onChange={setSelectedRole}
            options={roleOptions}
            className="w-full sm:w-44"
          />
          <Select
            aria-label="Filtrar por departamento"
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            options={departmentOptions}
            className="w-full sm:w-44"
          />
          <Select
            aria-label="Filtrar por estado"
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value as StatusFilter)}
            options={STATUS_OPTIONS}
            className="w-full sm:w-44"
          />
        </div>
      </div>

      {invitationsError && (
        <Alert tone="warning">
          {getApiErrorMessage(invitationsError, 'No se pudieron cargar las invitaciones.')}
        </Alert>
      )}

      <UsersTable
        items={pageItems}
        currentUserId={currentUser?.id}
        warehouses={warehouses}
        canManage={canManage}
        isLoading={isLoading || invitationsLoading}
        error={
          queryError
            ? usersErrorMessage(queryError, 'No se pudieron cargar los usuarios.')
            : undefined
        }
        emptyMessage={
          search ||
          selectedRole !== 'all' ||
          selectedDepartment !== 'all' ||
          selectedStatus !== 'all'
            ? 'No se encontraron usuarios con los filtros seleccionados.'
            : 'No hay usuarios registrados.'
        }
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onResendInvitation={handleResend}
        onRevokeInvitation={handleRevoke}
        togglingUserId={setUserActive.isPending ? setUserActive.variables.id : null}
        busyInvitationId={busyInvitationId}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roles={roles}
        warehouses={warehouses}
        onInvite={handleInvite}
        isSubmitting={inviteUser.isPending && busyInvitationId === null}
      />

      <UserModal
        isOpen={userToEdit !== null}
        onClose={() => setUserToEdit(null)}
        user={userToEdit}
        roles={roles}
        warehouses={warehouses}
        onSave={handleSave}
        isSubmitting={updateUser.isPending || changeUserRoles.isPending}
      />
    </div>
  );
}

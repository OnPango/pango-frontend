import { useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api';
import { Alert } from '@/shared/ui/components/Alert';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { usePagination } from '@/shared/ui/components/pagination/usePagination';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useAreas,
  useCreateUser,
  useRoles,
  useToggleUserStatus,
  useUpdateUser,
  useUsers,
} from '../api/users.queries';
import { UserModal } from '../components/UserModal';
import { UsersTable } from '../components/UsersTable';
import type { CreateUserInput, ManagedUser, UpdateUserInput } from '../types/users.types';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Solo activos' },
  { value: 'inactive', label: 'Solo inactivos' },
];

export default function UsersPage() {
  const { data: users = [], isLoading, error: queryError } = useUsers();
  const { data: roles = [] } = useRoles();
  const { data: areas = [] } = useAreas();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const toggleStatus = useToggleUserStatus();

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const roleOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: 'Todos los roles' },
      ...roles.map((r) => ({ value: r.id, label: r.name })),
    ],
    [roles],
  );
  const areaOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'all', label: 'Todas las áreas' },
      ...areas.map((a) => ({ value: a.id, label: a.name })),
    ],
    [areas],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search.trim() === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());

      const matchRole = selectedRole === 'all' || u.roleId === selectedRole;
      const matchArea = selectedArea === 'all' || u.areaId === selectedArea;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' && u.isActive) ||
        (selectedStatus === 'inactive' && !u.isActive);

      return matchSearch && matchRole && matchArea && matchStatus;
    });
  }, [users, search, selectedRole, selectedArea, selectedStatus]);

  const { page, pageSize, totalItems, pageItems, setPage, setPageSize } =
    usePagination<ManagedUser>(filteredUsers, 10);

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setActionError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setUserToEdit(user);
    setActionError(null);
    setIsModalOpen(true);
  };

  // On failure the promise rejects and the modal shows the error itself; the page only closes it on success.
  const handleCreateUser = async (data: CreateUserInput) => {
    await createUser.mutateAsync(data);
    setIsModalOpen(false);
  };

  const handleUpdateUser = async (data: UpdateUserInput) => {
    await updateUser.mutateAsync(data);
    setIsModalOpen(false);
  };

  const handleToggleStatus = (user: ManagedUser) => {
    setActionError(null);
    toggleStatus.mutate(
      { id: user.id, isActive: !user.isActive },
      {
        onError: (err) =>
          setActionError(getApiErrorMessage(err, 'No fue posible cambiar el estado del usuario.')),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Gestión de Usuarios"
        subtitle="Administra las personas del sistema, asignación de roles y áreas de trabajo."
        onAction={handleOpenCreate}
        icon={FiPlus}
        actionText="Nuevo Usuario"
      />

      {actionError && <Alert tone="danger">{actionError}</Alert>}

      {/* Filters Bar */}
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
            aria-label="Filtrar por área"
            value={selectedArea}
            onChange={setSelectedArea}
            options={areaOptions}
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

      {/* Users Table */}
      <UsersTable
        users={pageItems}
        isLoading={isLoading}
        error={queryError ? getApiErrorMessage(queryError) : undefined}
        emptyMessage={
          search || selectedRole !== 'all' || selectedArea !== 'all' || selectedStatus !== 'all'
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
        togglingUserId={toggleStatus.isPending ? toggleStatus.variables.id : null}
      />

      {/* Create / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        roles={roles}
        areas={areas}
        onCreateUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        isSubmitting={createUser.isPending || updateUser.isPending}
      />
    </div>
  );
}

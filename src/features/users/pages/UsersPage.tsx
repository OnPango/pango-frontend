import { useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { getApiErrorMessage } from '@/core/api';
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
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<ManagedUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const handleCreateUser = async (data: CreateUserInput) => {
    setActionError(null);
    try {
      await createUser.mutateAsync(data);
      setIsModalOpen(false);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No fue posible crear el usuario.');
      setActionError(message);
      throw err;
    }
  };

  const handleUpdateUser = async (data: UpdateUserInput) => {
    setActionError(null);
    try {
      await updateUser.mutateAsync(data);
      setIsModalOpen(false);
    } catch (err) {
      const message = getApiErrorMessage(err, 'No fue posible actualizar el usuario.');
      setActionError(message);
      throw err;
    }
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

      {actionError && (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {actionError}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico…"
            className="w-full rounded-2xl border border-line bg-surface py-3 pr-4 pl-10 text-sm text-fg outline-hidden focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rol filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-fg outline-hidden focus:border-accent"
            aria-label="Filtrar por rol"
          >
            <option value="all">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Área filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-fg outline-hidden focus:border-accent"
            aria-label="Filtrar por área"
          >
            <option value="all">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Estado filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-fg outline-hidden focus:border-accent"
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
          </select>
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
        isTogglingStatus={toggleStatus.isPending}
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

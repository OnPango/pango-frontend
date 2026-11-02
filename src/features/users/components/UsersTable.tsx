import { DataTable } from '@/shared/ui/components/DataTable';
import type { ManagedUser } from '../types/users.types';
import { getUsersTableColumns } from './usersTable.columns';

export interface UsersTableProps {
  users: ManagedUser[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (user: ManagedUser) => void;
  onToggleStatus: (user: ManagedUser) => void;
  togglingUserId?: string | null;
}

export function UsersTable({
  users,
  isLoading = false,
  error,
  emptyMessage = 'No hay usuarios para mostrar.',
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onToggleStatus,
  togglingUserId = null,
}: UsersTableProps) {
  const columns = getUsersTableColumns({
    onEdit,
    onToggleStatus,
    togglingUserId,
  });

  return (
    <DataTable<ManagedUser>
      caption="Lista de usuarios registrados"
      isLoading={isLoading}
      error={error}
      emptyMessage={emptyMessage}
      getRowKey={(row) => row.id}
      columns={columns}
      rows={users}
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
        pageSizeOptions: [5, 10, 20],
        onPageSizeChange,
      }}
    />
  );
}

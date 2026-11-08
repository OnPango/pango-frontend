import { DataTable } from '@/shared/ui/components/DataTable';
import type { UserListItem } from '../types/users.types';
import { getUsersTableColumns, type UsersTableActions } from './usersTable.columns';

export interface UsersTableProps extends UsersTableActions {
  items: UserListItem[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function UsersTable({
  items,
  isLoading = false,
  error,
  emptyMessage = 'No hay usuarios para mostrar.',
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  ...actions
}: UsersTableProps) {
  return (
    <DataTable<UserListItem>
      caption="Usuarios e invitaciones de la organización"
      isLoading={isLoading}
      error={error}
      emptyMessage={emptyMessage}
      getRowKey={(item) => item.id}
      columns={getUsersTableColumns(actions)}
      rows={items}
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

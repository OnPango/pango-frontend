import { useMemo } from 'react';
import { MdEdit } from 'react-icons/md';
import type { Column } from '@/shared/types/dataTable';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import type { Warehouse } from '../types/warehouses.types';
import { WarehouseStatusBadge, WarehouseTypeBadge } from './WarehouseTypeBadge';

export interface WarehousesTableProps {
  warehouses: Warehouse[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  onOpen: (warehouse: Warehouse) => void;
  /** Editing and closing need `warehouse.manage`; without them the table only opens the detail. */
  onEdit?: (warehouse: Warehouse) => void;
  onToggleStatus?: (warehouse: Warehouse) => void;
}

export function WarehousesTable({
  warehouses,
  isLoading = false,
  error,
  emptyMessage = 'No hay almacenes para mostrar.',
  onOpen,
  onEdit,
  onToggleStatus,
}: WarehousesTableProps) {
  const columns = useMemo<Column<Warehouse>[]>(() => {
    const base: Column<Warehouse>[] = [
      {
        key: 'warehouse',
        skeleton: 'title',
        header: 'Almacén',
        cell: (warehouse) => (
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpen(warehouse)}
              className="max-w-full justify-start truncate rounded-md p-0 text-left text-sm hover:bg-transparent hover:text-primary hover:underline"
              aria-label={`Ver detalle de ${warehouse.name}`}
            >
              {warehouse.name}
            </Button>
            <p className="truncate text-xs text-muted">{warehouse.code}</p>
          </div>
        ),
      },
      {
        key: 'type',
        skeleton: 'badge',
        header: 'Tipo',
        cell: (warehouse) => <WarehouseTypeBadge type={warehouse.type} />,
      },
      {
        key: 'address',
        header: 'Dirección',
        cell: (warehouse) => <span className="text-xs text-muted">{warehouse.address ?? '—'}</span>,
      },
      {
        key: 'status',
        skeleton: 'badge',
        header: 'Estado',
        cell: (warehouse) => <WarehouseStatusBadge isActive={warehouse.isActive} />,
      },
    ];
    if (!onEdit || !onToggleStatus) return base;
    return [
      ...base,
      {
        key: 'actions',
        skeleton: 'button',
        header: <span className="sr-only">Acciones</span>,
        className: 'text-right',
        cell: (warehouse) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus(warehouse)}
              className={`text-xs ${
                warehouse.isActive
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-success hover:bg-success/10'
              }`}
              aria-label={
                warehouse.isActive ? `Cerrar ${warehouse.name}` : `Reabrir ${warehouse.name}`
              }
            >
              {warehouse.isActive ? 'Cerrar' : 'Reabrir'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(warehouse)}
              className="gap-2 p-1.5 text-muted hover:text-fg"
              aria-label={`Editar ${warehouse.name}`}
            >
              Editar
              <MdEdit aria-hidden className="size-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, [onOpen, onEdit, onToggleStatus]);

  return (
    <DataTable<Warehouse>
      caption="Almacenes de la organización"
      isLoading={isLoading}
      error={error}
      emptyMessage={emptyMessage}
      getRowKey={(warehouse) => warehouse.id}
      columns={columns}
      rows={warehouses}
    />
  );
}

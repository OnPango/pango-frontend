import { useCallback, useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useWarehouses } from '../api/warehouses.queries';
import { WarehouseDetailPanel } from '../components/WarehouseDetailPanel';
import { WarehouseFormModal } from '../components/WarehouseFormModal';
import { WarehouseStatusDialog } from '../components/WarehouseStatusDialog';
import { WarehousesTable } from '../components/WarehousesTable';
import { filterWarehouses } from '../content/warehouse.labels';
import { warehousesErrorMessage } from '../content/warehouses.errors';
import { useWarehouseFilters } from '../hooks/useWarehouseFilters';
import type { Warehouse, WarehouseStatusFilter, WarehouseType } from '../types/warehouses.types';

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'warehouse', label: 'Bodegas' },
  { value: 'store', label: 'Tiendas' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Cerrados' },
  { value: 'all', label: 'Todos los estados' },
];

/** What happened last, for the notice above the list. */
type Notice = { text: string; created?: boolean };

export default function WarehousesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = hasAnyPermission(currentUser, ['warehouse.manage']);
  const canManageUsers = hasAnyPermission(currentUser, ['user.manage']);

  const { search, setSearch, type, setType, status, setStatus, filters, isFiltered } =
    useWarehouseFilters();
  const { data: warehouses, isLoading, error } = useWarehouses();

  const visible = useMemo(() => filterWarehouses(warehouses ?? [], filters), [warehouses, filters]);

  // The panel and the dialogs keep an id, not a copy: they show the warehouse as the list has it now.
  const [openId, setOpenId] = useState<string | null>(null);
  const [formFor, setFormFor] = useState<'new' | string | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const byId = (id: string | null) => warehouses?.find((warehouse) => warehouse.id === id) ?? null;
  const opened = byId(openId);
  const editing = formFor && formFor !== 'new' ? byId(formFor) : null;
  const changingStatus = byId(statusId);

  const handleOpen = useCallback((warehouse: Warehouse) => setOpenId(warehouse.id), []);
  const handleEdit = useCallback((warehouse: Warehouse) => {
    setNotice(null);
    setFormFor(warehouse.id);
  }, []);
  const handleToggleStatus = useCallback((warehouse: Warehouse) => {
    setNotice(null);
    setStatusId(warehouse.id);
  }, []);

  const handleSaved = (warehouse: Warehouse) => {
    setNotice(
      formFor === 'new'
        ? { text: `Almacén «${warehouse.name}» creado.`, created: true }
        : { text: `Cambios guardados en «${warehouse.name}».` },
    );
    setFormFor(null);
  };

  const handleStatusDone = (warehouse: Warehouse) => {
    setNotice({
      text: warehouse.isActive
        ? `«${warehouse.name}» está abierto otra vez.`
        : `«${warehouse.name}» quedó cerrado.`,
    });
    setStatusId(null);
  };

  const emptyMessage = isFiltered
    ? 'Ningún almacén coincide con la búsqueda.'
    : status === 'inactive'
      ? 'No hay almacenes cerrados.'
      : canManage
        ? 'Aún no tienes almacenes. Crea el primero para poder registrar inventario.'
        : 'Aún no tienes acceso a ningún almacén.';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Almacenes"
        subtitle="Las bodegas y tiendas de tu organización: donde se guarda, se vende y se mueve el inventario."
        onAction={
          canManage
            ? () => {
                setNotice(null);
                setFormFor('new');
              }
            : undefined
        }
        icon={FiPlus}
        actionText="Nuevo almacén"
      />

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice.text}
          {notice.created && (
            <>
              {' '}
              Para que tu equipo trabaje en él, asígnales un rol en este almacén
              {canManageUsers ? (
                <>
                  {' desde '}
                  <Link to="/users" className="font-semibold text-primary underline">
                    Usuarios
                  </Link>
                </>
              ) : (
                ' desde Usuarios'
              )}
              .
            </>
          )}
        </Alert>
      )}

      {!canManage && (
        <p className="text-sm text-muted">Ves los almacenes donde tienes un rol asignado.</p>
      )}

      <section
        aria-label="Búsqueda y filtros"
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        <TextBox
          type="search"
          aria-label="Buscar almacén"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, código o dirección…"
          leadingIcon={FiSearch}
          containerClassName="flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filtrar por tipo"
            value={type}
            onChange={(value) => setType(value as WarehouseType | 'all')}
            options={TYPE_OPTIONS}
            className="w-full sm:w-44"
          />
          <Select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(value) => setStatus(value as WarehouseStatusFilter)}
            options={STATUS_OPTIONS}
            className="w-full sm:w-44"
          />
        </div>
      </section>

      <WarehousesTable
        warehouses={visible}
        isLoading={isLoading}
        error={
          error ? warehousesErrorMessage(error, 'No se pudieron cargar los almacenes.') : undefined
        }
        emptyMessage={emptyMessage}
        onOpen={handleOpen}
        onEdit={canManage ? handleEdit : undefined}
        onToggleStatus={canManage ? handleToggleStatus : undefined}
      />

      {opened && (
        <WarehouseDetailPanel
          warehouse={opened}
          canManage={canManage}
          onClose={() => setOpenId(null)}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <WarehouseFormModal
        isOpen={formFor === 'new' || editing !== null}
        warehouse={editing}
        onClose={() => setFormFor(null)}
        onSaved={handleSaved}
      />

      {changingStatus && (
        <WarehouseStatusDialog
          warehouse={changingStatus}
          onClose={() => setStatusId(null)}
          onDone={handleStatusDone}
        />
      )}
    </div>
  );
}

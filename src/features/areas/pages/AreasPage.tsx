import { useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import type { Column } from '@/shared/types/dataTable';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useDepartments } from '../api/areas.queries';
import { DepartmentFormModal } from '../components/DepartmentFormModal';
import { DepartmentStatusDialog } from '../components/DepartmentStatusDialog';
import { areasErrorMessage } from '../content/areas.errors';
import type { Department, DepartmentStatusFilter } from '../types/areas.types';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
  { value: 'all', label: 'Todos los estados' },
];

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export default function AreasPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = hasAnyPermission(currentUser, ['department.manage']);
  const { data: departments, isLoading, error } = useDepartments();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<DepartmentStatusFilter>('active');
  const [formFor, setFormFor] = useState<'new' | string | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const byId = (id: string | null) =>
    departments?.find((department) => department.id === id) ?? null;
  const editing = formFor && formFor !== 'new' ? byId(formFor) : null;
  const changingStatus = byId(statusId);

  const visible = useMemo(() => {
    const words = plain(search).split(/\s+/).filter(Boolean);
    return (departments ?? []).filter((department) => {
      if (status === 'active' && !department.isActive) return false;
      if (status === 'inactive' && department.isActive) return false;
      const haystack = plain(`${department.name} ${department.costCenter ?? ''}`);
      return words.every((word) => haystack.includes(word));
    });
  }, [departments, search, status]);

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Área',
      cell: (department) => <span className="font-semibold text-fg">{department.name}</span>,
    },
    {
      key: 'costCenter',
      header: 'Centro de costo',
      cell: (department) => (
        <span className="text-sm text-fg/90">{department.costCenter ?? '—'}</span>
      ),
    },
    {
      key: 'people',
      header: 'Personas',
      className: 'text-right',
      cell: (department) => (
        <span className="text-sm text-fg/90 tabular-nums">{department.userCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (department) => (
        <Badge tone={department.isActive ? 'success' : 'neutral'} dot>
          {department.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: <span className="sr-only">Acciones</span>,
            className: 'text-right',
            cell: (department: Department) => (
              <div className="flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotice(null);
                    setStatusId(department.id);
                  }}
                  className={`text-xs ${
                    department.isActive
                      ? 'text-danger hover:bg-danger/10'
                      : 'text-success hover:bg-success/10'
                  }`}
                  aria-label={
                    department.isActive
                      ? `Desactivar ${department.name}`
                      : `Reactivar ${department.name}`
                  }
                >
                  {department.isActive ? 'Desactivar' : 'Reactivar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotice(null);
                    setFormFor(department.id);
                  }}
                  className="gap-2 p-1.5 text-muted hover:text-fg"
                  aria-label={`Editar ${department.name}`}
                >
                  Editar
                  <MdEdit aria-hidden className="size-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Áreas"
        subtitle="Las áreas de tu organización. Cada persona pertenece a una, y es el área la que pide productos a los almacenes."
        onAction={
          canManage
            ? () => {
                setNotice(null);
                setFormFor('new');
              }
            : undefined
        }
        icon={FiPlus}
        actionText="Nueva área"
      />

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <section
        aria-label="Búsqueda y filtros"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <TextBox
          type="search"
          aria-label="Buscar área"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o centro de costo…"
          leadingIcon={FiSearch}
          containerClassName="flex-1"
        />
        <Select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(value) => setStatus(value as DepartmentStatusFilter)}
          options={STATUS_OPTIONS}
          className="w-full sm:w-44"
        />
      </section>

      <DataTable<Department>
        caption="Áreas de la organización"
        columns={columns}
        rows={visible}
        getRowKey={(department) => department.id}
        isLoading={isLoading}
        error={error ? areasErrorMessage(error, 'No se pudieron cargar las áreas.') : undefined}
        emptyMessage={
          search.trim()
            ? 'Ningún área coincide con la búsqueda.'
            : status === 'inactive'
              ? 'No hay áreas inactivas.'
              : canManage
                ? 'Aún no hay áreas. Crea la primera: sin área, nadie puede pedir productos.'
                : 'Aún no hay áreas.'
        }
      />

      <DepartmentFormModal
        isOpen={formFor === 'new' || editing !== null}
        department={editing}
        onClose={() => setFormFor(null)}
        onSaved={(department) => {
          setNotice(
            formFor === 'new'
              ? `Área «${department.name}» creada. Asígnala a las personas desde Usuarios.`
              : `Cambios guardados en «${department.name}».`,
          );
          setFormFor(null);
        }}
      />

      {changingStatus && (
        <DepartmentStatusDialog
          department={changingStatus}
          onClose={() => setStatusId(null)}
          onDone={(department) => {
            setNotice(
              department.isActive
                ? `«${department.name}» está activa otra vez.`
                : `«${department.name}» quedó inactiva.`,
            );
            setStatusId(null);
          }}
        />
      )}
    </div>
  );
}

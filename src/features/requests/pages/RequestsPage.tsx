import { useCallback, useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useMyDepartment,
  useOpenWarehouses,
  useRequestableProducts,
  useRequestDepartments,
  useRequests,
} from '../api/requests.queries';
import { CancelRequestDialog } from '../components/CancelRequestDialog';
import { NewRequestModal } from '../components/NewRequestModal';
import { RequestsTable } from '../components/RequestsTable';
import { STATUS_LABELS } from '../content/request.labels';
import { requestsErrorMessage } from '../content/requests.errors';
import type { Option, RequestStatus, StockRequest } from '../types/requests.types';

const ALL = 'all';

const STATUS_OPTIONS: SelectOption[] = [
  { value: ALL, label: 'Todos los estados' },
  ...(Object.keys(STATUS_LABELS) as RequestStatus[]).map((status) => ({
    value: status,
    label: STATUS_LABELS[status].label,
  })),
];

export default function RequestsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canCreate = hasAnyPermission(currentUser, ['stock_request.create']);
  const canReadUsers = hasAnyPermission(currentUser, ['user.read', 'user.manage']);
  const canManageUsers = hasAnyPermission(currentUser, ['user.manage']);

  // The user's area: known when they may read users, otherwise the API assigns it on create.
  const myDepartmentQuery = useMyDepartment(currentUser?.id ?? null, canReadUsers);
  const myDepartment: Option | null | undefined = myDepartmentQuery.data;
  const hasNoDepartment = myDepartmentQuery.isSuccess && myDepartment === null;

  // Where the user may create requests: their role grants with `stock_request.create`. A grant on
  // every warehouse (the Owner) means every open warehouse.
  const grants = (currentUser?.roles ?? []).filter((grant) =>
    grant.permissions.includes('stock_request.create'),
  );
  const everyWarehouse = grants.some((grant) => grant.warehouse === null);
  const openWarehouses = useOpenWarehouses(canCreate && everyWarehouse);
  const requestWarehouses = useMemo<Option[]>(() => {
    if (everyWarehouse) return openWarehouses.data ?? [];
    const byId = new Map<string, Option>();
    for (const grant of grants) {
      if (grant.warehouse) byId.set(grant.warehouse.id, grant.warehouse);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [everyWarehouse, openWarehouses.data, grants]);
  const products = useRequestableProducts(canCreate);

  // Filters: by default, the user's own area (CU-08 step 7: "el listado de solicitudes del área").
  const [departmentChoice, setDepartmentChoice] = useState<string | null>(null);
  const departmentFilter = departmentChoice ?? myDepartment?.id ?? ALL;
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const filters = {
    departmentId: departmentFilter === ALL ? null : departmentFilter,
    status: status === ALL ? null : (status as RequestStatus),
    page,
    pageSize,
  };
  // When the user's area will be known, wait for it: listing every area first and then refetching
  // by area would flash other areas' requests.
  const waitingForArea = canReadUsers && myDepartmentQuery.isPending && departmentChoice === null;
  const requests = useRequests(filters, !waitingForArea);
  const departments = useRequestDepartments();
  const departmentOptions: SelectOption[] = [
    { value: ALL, label: 'Todas las áreas' },
    ...(departments.data ?? []).map((department) => ({
      value: department.id,
      label: department.name,
      description: department.id === myDepartment?.id ? 'Tu área' : undefined,
    })),
  ];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancelling, setCancelling] = useState<StockRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleCancel = useCallback((request: StockRequest) => {
    setNotice(null);
    setCancelling(request);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitudes"
        subtitle="Las áreas piden productos a los almacenes. Una solicitud queda pendiente hasta que el almacén la atiende."
        onAction={
          canCreate && !hasNoDepartment
            ? () => {
                setNotice(null);
                setIsCreateOpen(true);
              }
            : undefined
        }
        icon={FiPlus}
        actionText="Nueva solicitud"
      />

      {canCreate && hasNoDepartment && (
        <Alert tone="warning" title="No puedes crear solicitudes todavía">
          No perteneces a ningún área.{' '}
          {canManageUsers ? (
            <>
              Asígnate una desde{' '}
              <Link to="/users" className="font-semibold text-primary underline">
                Usuarios
              </Link>
              .
            </>
          ) : (
            'Pide a un administrador que te asigne una.'
          )}
        </Alert>
      )}

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <section aria-label="Filtros" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          aria-label="Filtrar por área"
          value={departmentFilter}
          onChange={(value) => {
            setDepartmentChoice(value || ALL);
            setPage(1);
          }}
          options={departmentOptions}
          searchable
          searchPlaceholder="Buscar área…"
          emptyMessage="Ningún área coincide"
          className="w-full sm:w-64"
        />
        <Select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(value) => {
            setStatus(value || ALL);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="w-full sm:w-48"
        />
      </section>

      <RequestsTable
        requests={requests.data?.items ?? []}
        isLoading={requests.isLoading || waitingForArea}
        error={
          requests.error
            ? requestsErrorMessage(requests.error, 'No se pudieron cargar las solicitudes.')
            : undefined
        }
        emptyMessage={
          departmentChoice === null && status === ALL && myDepartment
            ? 'Tu área aún no tiene solicitudes.'
            : departmentFilter !== ALL || status !== ALL
              ? 'Ninguna solicitud coincide con los filtros.'
              : 'Aún no hay solicitudes.'
        }
        page={page}
        pageSize={pageSize}
        totalItems={requests.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        currentUserId={currentUser?.id ?? null}
        onCancel={handleCancel}
      />

      <NewRequestModal
        isOpen={isCreateOpen}
        department={myDepartment ?? undefined}
        warehouses={requestWarehouses}
        products={products.data ?? []}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(request) => {
          setIsCreateOpen(false);
          // Show it where it lands: its area's list, first page.
          setDepartmentChoice(request.department.id);
          setStatus(ALL);
          setPage(1);
          setNotice(
            `Solicitud ${request.number} creada para ${request.warehouse.name}. Quedó pendiente; el inventario no cambia.`,
          );
        }}
      />

      {cancelling && (
        <CancelRequestDialog
          request={cancelling}
          onClose={() => setCancelling(null)}
          onDone={(request) => {
            setCancelling(null);
            setNotice(`Solicitud ${request.number} cancelada.`);
          }}
        />
      )}
    </div>
  );
}

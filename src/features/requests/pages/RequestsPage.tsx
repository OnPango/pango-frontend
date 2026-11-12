import { useCallback, useMemo, useState } from 'react';
import { FiInbox, FiPlus, FiUsers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useMyDepartment,
  useOpenWarehouses,
  useRequestableProducts,
  useRequestDepartments,
  usePrefetchRequests,
  useRequests,
} from '../api/requests.queries';
import { CancelRequestDialog } from '../components/CancelRequestDialog';
import { FulfilRequestModal } from '../components/FulfilRequestModal';
import { RejectRequestDialog } from '../components/RejectRequestDialog';
import { RequestDetailPanel, type RequestAction } from '../components/RequestDetailPanel';
import { StartAttentionDialog } from '../components/StartAttentionDialog';
import { NewRequestModal } from '../components/NewRequestModal';
import { RequestsTable } from '../components/RequestsTable';
import { STATUS_LABELS } from '../content/request.labels';
import { attendance, attendedWarehouses } from '../content/request.permissions';
import { requestsErrorMessage } from '../content/requests.errors';
import type { Option, RequestFilters, RequestStatus, StockRequest } from '../types/requests.types';

const ALL = 'all';

/** "De mi área" (who asks) or "Para atender" (the warehouse staff, US-030). */
type View = 'mine' | 'attend';
const VIEWS = [
  { value: 'mine' as const, label: 'De mi área', icon: FiUsers },
  { value: 'attend' as const, label: 'Para atender', icon: FiInbox },
];

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
  // Where the user attends requests; "Para atender" only exists for them.
  const attending = attendedWarehouses(currentUser);
  const attendsAny = attending === 'all' || attending.length > 0;
  const attendAll = useOpenWarehouses(attending === 'all');
  const attendOptions: Option[] = attending === 'all' ? (attendAll.data ?? []) : attending;
  const [view, setViewState] = useState<View>(() => (canCreate || !attendsAny ? 'mine' : 'attend'));
  const products = useRequestableProducts(canCreate || attendsAny);

  // Filters: by default, the user's own area (CU-08 step 7: "el listado de solicitudes del área").
  const [departmentChoice, setDepartmentChoice] = useState<string | null>(null);
  const departmentFilter = departmentChoice ?? myDepartment?.id ?? ALL;
  const [warehouseFilter, setWarehouseFilter] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(view === 'attend' ? 'pending' : ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const setView = (next: View) => {
    setViewState(next);
    // What needs attention is what is pending; one's own area, everything.
    setStatus(next === 'attend' ? 'pending' : ALL);
    setPage(1);
  };
  const filtersOf = (of: View, ofStatus: string, ofPage: number): RequestFilters => ({
    departmentId: of === 'mine' && departmentFilter !== ALL ? departmentFilter : null,
    warehouseId: of === 'attend' && warehouseFilter !== ALL ? warehouseFilter : null,
    status: ofStatus === ALL ? null : (ofStatus as RequestStatus),
    page: ofPage,
    pageSize,
  });
  // When the user's area will be known, wait for it: listing every area first and then refetching
  // by area would flash other areas' requests.
  const areaPending = canReadUsers && myDepartmentQuery.isPending && departmentChoice === null;
  const waitingForArea = view === 'mine' && areaPending;
  const requests = useRequests(filtersOf(view, status, page), !waitingForArea);
  // The other tab, as it opens (its default status, first page), loaded once this list is in: the
  // first switch between tabs is then immediate on a slow API.
  const otherView: View = view === 'mine' ? 'attend' : 'mine';
  usePrefetchRequests(
    filtersOf(otherView, otherView === 'attend' ? 'pending' : ALL, 1),
    attendsAny && requests.isSuccess && !(otherView === 'mine' && areaPending),
  );
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [acting, setActing] = useState<{ action: RequestAction; request: StockRequest } | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);

  const act = useCallback((action: RequestAction, request: StockRequest) => {
    setNotice(null);
    setActing({ action, request });
  }, []);
  const handleCancel = useCallback((request: StockRequest) => act('cancel', request), [act]);
  const handleOpen = useCallback((request: StockRequest) => setOpenId(request.id), []);
  const attendanceOf = useCallback(
    (request: StockRequest) => attendance(currentUser, request),
    [currentUser],
  );
  const done = (text: string) => {
    setActing(null);
    setNotice(text);
  };

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

      {attendsAny && (
        <SegmentedControl<View>
          legend="Qué solicitudes ver"
          options={VIEWS}
          value={view}
          onChange={setView}
        />
      )}

      <section aria-label="Filtros" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {view === 'attend' ? (
          <Select
            aria-label="Filtrar por almacén"
            value={warehouseFilter}
            onChange={(value) => {
              setWarehouseFilter(value || ALL);
              setPage(1);
            }}
            options={[
              { value: ALL, label: 'Todos tus almacenes' },
              ...attendOptions.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
            ]}
            searchable
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
            className="w-full sm:w-64"
          />
        ) : (
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
        )}
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
        // Another view, filter or page is loading: the rows on screen are the previous ones.
        isRefreshing={requests.isPlaceholderData}
        error={
          requests.error
            ? requestsErrorMessage(requests.error, 'No se pudieron cargar las solicitudes.')
            : undefined
        }
        emptyMessage={
          view === 'attend'
            ? status === 'pending'
              ? 'No hay solicitudes pendientes por atender.'
              : 'Ninguna solicitud coincide con los filtros.'
            : departmentChoice === null && status === ALL && myDepartment
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
        onOpen={handleOpen}
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
          setViewState('mine');
          setDepartmentChoice(request.department.id);
          setStatus(ALL);
          setPage(1);
          setNotice(
            `Solicitud ${request.number} creada para ${request.warehouse.name}. Quedó pendiente; el inventario no cambia.`,
          );
        }}
      />

      {openId && (
        <RequestDetailPanel
          requestId={openId}
          attendance={attendanceOf}
          currentUserId={currentUser?.id ?? null}
          onClose={() => setOpenId(null)}
          onAction={act}
        />
      )}

      {acting?.action === 'cancel' && (
        <CancelRequestDialog
          request={acting.request}
          onClose={() => setActing(null)}
          onDone={(request) => done(`Solicitud ${request.number} cancelada.`)}
        />
      )}
      {acting?.action === 'start' && (
        <StartAttentionDialog
          request={acting.request}
          onClose={() => setActing(null)}
          onDone={(request) =>
            done(`Solicitud ${request.number} en atención. Su existencia quedó reservada.`)
          }
        />
      )}
      {acting?.action === 'reject' && (
        <RejectRequestDialog
          request={acting.request}
          onClose={() => setActing(null)}
          onDone={(request) => done(`Solicitud ${request.number} rechazada.`)}
        />
      )}
      {acting?.action === 'fulfil' && (
        <FulfilRequestModal
          request={acting.request}
          products={products.data ?? []}
          onClose={() => setActing(null)}
          onDone={(request) =>
            done(
              `Solicitud ${request.number} atendida. Se registró la salida ${request.movement?.number ?? ''} y la existencia se descontó.`,
            )
          }
        />
      )}
    </div>
  );
}

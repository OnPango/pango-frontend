import { useCallback, useMemo, useState } from 'react';
import { FiArchive, FiInbox, FiPlus, FiUsers, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { DatePicker } from '@/shared/ui/components/form/date/DatePicker';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useHistoryProducts,
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
import {
  ACTIVE_STATUSES,
  type Option,
  type RequestFilters,
  type RequestStatus,
  type StockRequest,
} from '../types/requests.types';

const ALL = 'all';
const ACTIVE = 'active';

/**
 * "De mi área" (who asks) and "Para atender" (the warehouse staff, US-030) list the active
 * requests; "Histórico" the finished ones, by product, area and period (US-032, RF-REQ-005).
 */
type View = 'mine' | 'attend' | 'history';
const VIEW_OPTIONS = {
  mine: { value: 'mine' as const, label: 'De mi área', icon: FiUsers },
  attend: { value: 'attend' as const, label: 'Para atender', icon: FiInbox },
  history: { value: 'history' as const, label: 'Histórico', icon: FiArchive },
};

/** What each list opens with: one's own area, all that is active; to attend, what is pending. */
const DEFAULT_STATUS: Record<View, string> = {
  mine: ACTIVE,
  attend: 'pending',
  history: 'fulfilled',
};

const statusOption = (status: RequestStatus) => ({
  value: status,
  label: STATUS_LABELS[status].label,
});
const ACTIVE_OPTIONS: SelectOption[] = [
  { value: ACTIVE, label: 'Todas las activas' },
  ...ACTIVE_STATUSES.map(statusOption),
];
// One finished status at a time: the API filters by a single one.
const HISTORY_OPTIONS: SelectOption[] = (['fulfilled', 'rejected', 'cancelled'] as const).map(
  statusOption,
);
const FINISHED_PLURAL: Partial<Record<RequestStatus, string>> = {
  fulfilled: 'atendidas',
  rejected: 'rechazadas',
  cancelled: 'canceladas',
};

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
  const views = [
    VIEW_OPTIONS.mine,
    ...(attendsAny ? [VIEW_OPTIONS.attend] : []),
    VIEW_OPTIONS.history,
  ];

  // Filters: by default, the user's own area (CU-08 step 7: "el listado de solicitudes del área").
  const [departmentChoice, setDepartmentChoice] = useState<string | null>(null);
  const departmentFilter = departmentChoice ?? myDepartment?.id ?? ALL;
  const [warehouseFilter, setWarehouseFilter] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(DEFAULT_STATUS[view]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  // The history's own filters: by product, area and period (when the request was made).
  const [historyDepartment, setHistoryDepartment] = useState<string>(ALL);
  const [historyProduct, setHistoryProduct] = useState<string>(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const historyProducts = useHistoryProducts(view === 'history');
  const setView = (next: View) => {
    setViewState(next);
    setStatus(DEFAULT_STATUS[next]);
    setPage(1);
  };
  const filtersOf = (of: View, ofStatus: string, ofPage: number): RequestFilters => {
    const history = of === 'history';
    const department = history ? historyDepartment : of === 'mine' ? departmentFilter : ALL;
    return {
      departmentId: department !== ALL ? department : null,
      warehouseId: of === 'attend' && warehouseFilter !== ALL ? warehouseFilter : null,
      status: ofStatus as RequestStatus | 'active',
      productId: history && historyProduct !== ALL ? historyProduct : null,
      from: history && from ? from : null,
      to: history && to ? to : null,
      page: ofPage,
      pageSize,
    };
  };
  const historyFiltered =
    historyDepartment !== ALL ||
    historyProduct !== ALL ||
    !!from ||
    !!to ||
    status !== DEFAULT_STATUS.history;
  const clearHistoryFilters = () => {
    setHistoryDepartment(ALL);
    setHistoryProduct(ALL);
    setFrom('');
    setTo('');
    setStatus(DEFAULT_STATUS.history);
    setPage(1);
  };
  // When the user's area will be known, wait for it: listing every area first and then refetching
  // by area would flash other areas' requests.
  const areaPending = canReadUsers && myDepartmentQuery.isPending && departmentChoice === null;
  const waitingForArea = view === 'mine' && areaPending;
  const requests = useRequests(filtersOf(view, status, page), !waitingForArea);
  // The other active tab, as it opens (its default status, first page), loaded once this list is
  // in: the first switch between them is then immediate on a slow API.
  const otherView: View = view === 'mine' ? 'attend' : 'mine';
  usePrefetchRequests(
    filtersOf(otherView, DEFAULT_STATUS[otherView], 1),
    view !== 'history' &&
      attendsAny &&
      requests.isSuccess &&
      !(otherView === 'mine' && areaPending),
  );
  const historyProductOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: 'Todos los productos' },
      // The code in the label: the search matches labels only.
      ...(historyProducts.data ?? []).map((product) => ({
        value: product.id,
        label: `${product.name} · ${product.sku}`,
      })),
    ],
    [historyProducts.data],
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
  /** A finished request leaves the active lists. */
  const finished = (text: string) => done(`${text} Queda en el histórico.`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitudes"
        subtitle="Las áreas piden productos a los almacenes. Aquí están las activas; las atendidas, rechazadas y canceladas quedan en el histórico."
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

      <SegmentedControl<View>
        legend="Qué solicitudes ver"
        options={views}
        value={view}
        onChange={setView}
      />

      {view === 'history' ? (
        <section aria-label="Filtros" className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Select
              aria-label="Filtrar por producto"
              value={historyProduct}
              onChange={(value) => {
                setHistoryProduct(value || ALL);
                setPage(1);
              }}
              options={historyProductOptions}
              searchable
              searchPlaceholder="Buscar por código o nombre…"
              emptyMessage="Ningún producto coincide"
              className="w-full lg:w-80"
            />
            <Select
              aria-label="Filtrar por área"
              value={historyDepartment}
              onChange={(value) => {
                setHistoryDepartment(value || ALL);
                setPage(1);
              }}
              options={departmentOptions}
              searchable
              searchPlaceholder="Buscar área…"
              emptyMessage="Ningún área coincide"
              className="w-full lg:w-56"
            />
            <Select
              aria-label="Filtrar por estado"
              value={status}
              onChange={(value) => {
                setStatus(value || DEFAULT_STATUS.history);
                setPage(1);
              }}
              options={HISTORY_OPTIONS}
              className="w-full lg:w-48"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <DatePicker
              aria-label="Creadas desde"
              placeholder="Creadas desde"
              value={from}
              max={to || undefined}
              onChange={(value) => {
                setFrom(value);
                setPage(1);
              }}
              clearable
              className="w-full sm:w-48"
            />
            <DatePicker
              aria-label="Creadas hasta"
              placeholder="Creadas hasta"
              value={to}
              min={from || undefined}
              onChange={(value) => {
                setTo(value);
                setPage(1);
              }}
              clearable
              className="w-full sm:w-48"
            />
            {historyFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistoryFilters}
                className="gap-1.5 self-start sm:self-auto"
              >
                <FiX aria-hidden className="size-4" /> Limpiar filtros
              </Button>
            )}
          </div>
        </section>
      ) : (
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
                ...attendOptions.map((warehouse) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                })),
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
              setStatus(value || DEFAULT_STATUS[view]);
              setPage(1);
            }}
            options={ACTIVE_OPTIONS}
            className="w-full sm:w-52"
          />
        </section>
      )}

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
          view === 'history'
            ? historyDepartment !== ALL || historyProduct !== ALL || from || to
              ? 'Ninguna solicitud coincide con los filtros.'
              : `Aún no hay solicitudes ${FINISHED_PLURAL[status as RequestStatus] ?? 'terminadas'}.`
            : view === 'attend'
              ? status === 'pending'
                ? 'No hay solicitudes pendientes por atender.'
                : 'Ninguna solicitud coincide con los filtros.'
              : departmentChoice === null && status === ACTIVE && myDepartment
                ? 'Tu área no tiene solicitudes activas.'
                : departmentFilter !== ALL || status !== ACTIVE
                  ? 'Ninguna solicitud coincide con los filtros.'
                  : 'No hay solicitudes activas.'
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
          setStatus(ACTIVE);
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
          onDone={(request) => finished(`Solicitud ${request.number} cancelada.`)}
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
          onDone={(request) => finished(`Solicitud ${request.number} rechazada.`)}
        />
      )}
      {acting?.action === 'fulfil' && (
        <FulfilRequestModal
          request={acting.request}
          products={products.data ?? []}
          onClose={() => setActing(null)}
          onDone={(request) =>
            finished(
              `Solicitud ${request.number} atendida. Se registró la salida ${request.movement?.number ?? ''} y la existencia se descontó.`,
            )
          }
        />
      )}
    </div>
  );
}

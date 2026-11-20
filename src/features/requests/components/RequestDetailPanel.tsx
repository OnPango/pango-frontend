import type { ReactNode } from 'react';
import { formatQuantity } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Drawer } from '@/shared/ui/components/Drawer';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useRequest } from '../api/requests.queries';
import { formatDate, PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from '../content/request.labels';
import type { Attendance } from '../content/request.permissions';
import { requestsErrorMessage } from '../content/requests.errors';
import type { StockRequest } from '../types/requests.types';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

export type RequestAction = 'start' | 'fulfil' | 'reject' | 'cancel';

/**
 * A request's data, lines and status history (US-030: who and when; the reason when rejected),
 * with the actions its state allows: attending ones need `stock_request.approve` in its
 * warehouse and not being its requester; cancelling, being its requester.
 */
export function RequestDetailPanel({
  requestId,
  attendance,
  currentUserId,
  onClose,
  onAction,
}: {
  requestId: string;
  attendance: (request: StockRequest) => Attendance;
  currentUserId: string | null;
  onClose: () => void;
  onAction: (action: RequestAction, request: StockRequest) => void;
}) {
  const { data: request, error } = useRequest(requestId);
  const access = request ? attendance(request) : 'denied';
  const attends = access === 'allowed';
  const mine = request?.requestedBy.id === currentUserId;
  const open = request?.status === 'pending' || request?.status === 'inProgress';

  const actions: {
    action: RequestAction;
    label: string;
    variant: 'primary' | 'ghost' | 'danger';
  }[] = !request
    ? []
    : request.status === 'pending'
      ? [
          ...(mine
            ? [{ action: 'cancel' as const, label: 'Cancelar', variant: 'ghost' as const }]
            : []),
          ...(attends
            ? [
                { action: 'reject' as const, label: 'Rechazar', variant: 'danger' as const },
                {
                  action: 'start' as const,
                  label: 'Iniciar atención',
                  variant: 'primary' as const,
                },
              ]
            : []),
        ]
      : request.status === 'inProgress' && attends
        ? [
            { action: 'reject', label: 'Rechazar', variant: 'danger' },
            { action: 'fulfil', label: 'Confirmar consumo', variant: 'primary' },
          ]
        : [];

  return (
    <Drawer
      title={request ? request.number : 'Solicitud'}
      description={request ? TYPE_LABELS[request.type].label : undefined}
      onClose={onClose}
      footer={
        actions.length > 0 && request ? (
          <>
            {actions.map(({ action, label, variant }) => (
              <Button
                key={action}
                variant={variant === 'danger' ? 'ghost' : variant}
                size="sm"
                onClick={() => onAction(action, request)}
                className={variant === 'danger' ? 'text-danger hover:bg-danger/10' : undefined}
              >
                {label}
              </Button>
            ))}
          </>
        ) : undefined
      }
    >
      {!request ? (
        error ? (
          <Alert tone="danger">
            {requestsErrorMessage(error, 'No se pudo cargar la solicitud.')}
          </Alert>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted" role="status">
            <Spinner className="size-4" /> Cargando solicitud…
          </p>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_LABELS[request.status].tone} dot>
              {STATUS_LABELS[request.status].label}
            </Badge>
            <Badge
              appearance="outline"
              tone={request.priority === 1 ? 'danger' : 'neutral'}
              className="rounded-lg font-medium"
            >
              Prioridad {PRIORITY_LABELS[request.priority].toLowerCase()}
            </Badge>
          </div>

          {open && access === 'requester' && (
            <Alert tone="info">
              La pediste tú, así que no puedes atenderla: la atiende otra persona con permiso en{' '}
              {request.warehouse.name}.
            </Alert>
          )}
          {request.status === 'rejected' && request.rejectionReason && (
            <Alert tone="danger" title="Motivo del rechazo">
              {request.rejectionReason}
            </Alert>
          )}
          {request.movement && (
            <Alert tone="success">
              Atendida: se registró la salida {request.movement.number}, que cuenta como demanda.
            </Alert>
          )}

          <section aria-labelledby="request-data">
            <h3 id="request-data" className="sr-only">
              Datos de la solicitud
            </h3>
            <dl className="divide-y divide-line2">
              <Item label="Área">{request.department.name}</Item>
              <Item label="Almacén">{request.warehouse.name}</Item>
              <Item label="Solicitada por">
                {request.requestedBy.name ?? '—'}
                {mine && <span className="ml-1 text-xs text-muted">(tú)</span>}
              </Item>
              <Item label="Creada">{formatDate(request.createdAt, true)}</Item>
              <Item label="Se necesita">
                {request.requiredDate ? formatDate(request.requiredDate) : 'Sin fecha'}
              </Item>
              {request.notes && <Item label="Notas">{request.notes}</Item>}
            </dl>
          </section>

          <section aria-labelledby="request-lines" className="space-y-2">
            <h3 id="request-lines" className="text-sm font-bold text-fg">
              Productos
            </h3>
            <ul className="divide-y divide-line2 rounded-xl border border-line2">
              {request.lines.map((line) => (
                <li
                  key={line.lineNumber}
                  className="flex items-start justify-between gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-fg">{line.product.name}</p>
                    <p className="text-xs text-muted">{line.product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-fg tabular-nums">
                      {formatQuantity(line.quantity, line.product.unit)}
                    </p>
                    {line.reserved > 0 && (
                      <p className="text-[11px] text-muted">
                        {formatQuantity(line.reserved, line.product.unit)} reservado
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="request-history" className="space-y-2">
            <h3 id="request-history" className="text-sm font-bold text-fg">
              Historial
            </h3>
            <ol className="space-y-3 border-l border-line2 pl-4">
              {request.events.map((event, index) => (
                <li key={`${event.status}-${index}`} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 left-[-1.3rem] size-2 rounded-full bg-current text-muted"
                  />
                  <p className="text-sm text-fg">
                    <span className="font-semibold">{STATUS_LABELS[event.status].label}</span>
                    {event.by && <span className="text-fg/80"> · {event.by}</span>}
                  </p>
                  <p className="text-xs text-muted">{formatDate(event.at, true)}</p>
                  {event.reason && <p className="mt-0.5 text-xs text-fg/80">{event.reason}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  );
}

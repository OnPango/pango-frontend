import { formatQuantity } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Modal } from '@/shared/ui/components/Modal';
import { useSetAlertStatus } from '../api/alerts.queries';
import { SEVERITY_LABELS } from '../content/alert.labels';
import { alertsErrorMessage } from '../content/alerts.errors';
import type { StockAlert } from '../types/alerts.types';

/**
 * Confirms marking an alert attended by hand (US-045). It warns that this does not replenish
 * anything: the alert only leaves the pending list (and the bell) and resolves on its own once the
 * stock is back above the reorder point. On an error the dialog stays open and says why.
 */
export function AttendAlertDialog({
  alert,
  onClose,
  onDone,
}: {
  alert: StockAlert;
  onClose: () => void;
  onDone?: (alert: StockAlert) => void;
}) {
  const setStatus = useSetAlertStatus();
  const amount = (value: number) => formatQuantity(value, alert.product.unit);

  const confirm = () =>
    setStatus.mutate(
      { id: alert.id, status: 'attended' },
      {
        onSuccess: (saved) => {
          onDone?.(saved);
          onClose();
        },
      },
    );

  return (
    <Modal
      title="¿Marcar la alerta como atendida?"
      description={`${alert.product.name} · ${alert.warehouse.name}`}
      size="sm"
      onClose={onClose}
      dismissible={!setStatus.isPending}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={setStatus.isPending}>
            Cancelar
          </Button>
          <Button onClick={confirm} isLoading={setStatus.isPending}>
            Marcar atendida
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {setStatus.isError && (
          <Alert tone="danger">
            {alertsErrorMessage(setStatus.error, 'No se pudo marcar la alerta como atendida.')}
          </Alert>
        )}

        <Alert tone="warning" title="Marcarla no repone el stock">
          Úsalo cuando ya se hizo algo: un pedido en camino, un traslado o una solicitud. Para que
          el inventario cambie hay que registrar la entrada.
        </Alert>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl bg-canvas px-4 py-3">
          <dt className="text-muted">Severidad</dt>
          <dd className="font-semibold text-fg">
            {SEVERITY_LABELS[alert.severity].label}:{' '}
            {SEVERITY_LABELS[alert.severity].long.toLowerCase()}
          </dd>
          <dt className="text-muted">Disponible</dt>
          <dd className="text-fg tabular-nums">{amount(alert.available)}</dd>
          <dt className="text-muted">Punto de reorden</dt>
          <dd className="text-fg tabular-nums">{amount(alert.reorderPoint)}</dd>
          {alert.suggested > 0 && (
            <>
              <dt className="text-muted">Sugerido reponer</dt>
              <dd className="text-fg tabular-nums">{amount(alert.suggested)}</dd>
            </>
          )}
        </dl>

        <ul className="list-disc space-y-1 pl-5 text-fg/90">
          <li>Sale de las pendientes y de la campana, y queda tu nombre como quien la atendió.</li>
          <li>Se resuelve sola cuando el disponible supere el punto de reorden.</li>
          <li>Si empeora antes, vuelve a pendiente para que alguien la revise.</li>
        </ul>
        <p className="text-muted">Puedes devolverla a pendiente cuando quieras.</p>
      </div>
    </Modal>
  );
}

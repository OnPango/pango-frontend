import type { ReactNode } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { formatQuantity } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Drawer } from '@/shared/ui/components/Drawer';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useAlert, useCurrentStock } from '../api/alerts.queries';
import {
  formatDate,
  RESOLUTION_LABELS,
  SEVERITY_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
} from '../content/alert.labels';
import { alertsErrorMessage } from '../content/alerts.errors';
import type { AlertSeverity, CurrentStock, StockAlert } from '../types/alerts.types';
import { SeverityBadge } from './SeverityBadge';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

/** The severity the stock would have now (RF-ALT-001), or null above the reorder point. */
function severityNow(stock: CurrentStock): AlertSeverity | null {
  if (stock.reorderPoint <= 0 || stock.available > stock.reorderPoint) return null;
  return stock.available <= 0 ? 3 : stock.available <= stock.safetyStock ? 2 : 1;
}

/**
 * Compares the alert with the stock now. An open alert follows the stock (pango-core refreshes it
 * on every evaluation), so this mostly adds the on hand and reserved split; a resolved one keeps
 * its last values, and this shows where things stand since.
 */
function CurrentSituation({ alert, enabled }: { alert: StockAlert; enabled: boolean }) {
  const current = useCurrentStock(alert.product.id, alert.warehouse.id, enabled);
  if (!enabled) return null;
  const unit = alert.product.unit;
  const amount = (value: number) => formatQuantity(value, unit);

  let body: ReactNode;
  if (current.isPending) {
    body = (
      <p className="flex items-center gap-2 text-sm text-muted" role="status">
        <Spinner className="size-4" /> Consultando la existencia actual…
      </p>
    );
  } else if (current.isError) {
    body = (
      <Alert tone="warning">
        {alertsErrorMessage(current.error, 'No se pudo consultar la existencia actual.')}
      </Alert>
    );
  } else {
    const stock = current.data;
    const now = severityNow(stock);
    const worse = alert.status === 'open' && now !== null && now > alert.severity;
    const pointChanged = stock.reorderPoint !== alert.reorderPoint || stock.source !== alert.source;
    body = (
      <>
        <dl className="divide-y divide-line2">
          <Item label="Disponible">
            <span className="font-semibold tabular-nums">{amount(stock.available)}</span>
            {stock.reserved > 0 && (
              <span className="text-xs text-muted">
                {' '}
                ({amount(stock.onHand)} en existencia, {amount(stock.reserved)} reservado)
              </span>
            )}
          </Item>
          <Item label="Punto de reorden">
            {stock.reorderPoint > 0 ? (
              <>
                {amount(stock.reorderPoint)}{' '}
                <span className="text-xs text-muted">({SOURCE_LABELS[stock.source].long})</span>
              </>
            ) : (
              'Sin punto de reorden'
            )}
          </Item>
        </dl>
        {worse ? (
          <Alert tone="danger">
            Bajó desde la última actualización de la alerta: hoy sería{' '}
            <strong>{SEVERITY_LABELS[now].label.toLowerCase()}</strong> (
            {SEVERITY_LABELS[now].long.toLowerCase()}).
          </Alert>
        ) : alert.status === 'open' && now !== null ? (
          <p className="text-sm text-fg/80">Sigue en o bajo el punto de reorden.</p>
        ) : now === null && stock.reorderPoint > 0 ? (
          <p className="text-sm text-fg/80">Está por encima del punto de reorden.</p>
        ) : null}
        {pointChanged && (
          <p className="text-xs text-muted">
            El punto de reorden cambió desde la última actualización de la alerta.
          </p>
        )}
      </>
    );
  }

  return (
    <section aria-labelledby="alert-now" className="space-y-2">
      <h3 id="alert-now" className="text-sm font-bold text-fg">
        Ahora
      </h3>
      {body}
    </section>
  );
}

/**
 * One alert (US-044): what raised it, from which reorder point (manual or calculated), the
 * suggested replenishment and, with `stock.read` in its warehouse, how the product stands now.
 */
export function AlertDetailPanel({
  alertId,
  readsStock,
  onClose,
  onShowInventory,
}: {
  alertId: string;
  /** Whether the user may read the stock of a warehouse: the "Ahora" section and the link. */
  readsStock: (warehouseId: string) => boolean;
  onClose: () => void;
  onShowInventory: (alert: StockAlert) => void;
}) {
  const { data: alert, error } = useAlert(alertId);
  const showsStock = alert ? readsStock(alert.warehouse.id) : false;
  const amount = (value: number) => (alert ? formatQuantity(value, alert.product.unit) : '');

  return (
    <Drawer
      title={alert ? alert.product.name : 'Alerta'}
      description={alert ? `${alert.product.sku} · ${alert.warehouse.name}` : undefined}
      onClose={onClose}
      footer={
        alert && showsStock ? (
          <Button variant="primary" onClick={() => onShowInventory(alert)}>
            Ver en Inventario <FiArrowRight aria-hidden className="ml-1.5 size-4" />
          </Button>
        ) : undefined
      }
    >
      {!alert ? (
        error ? (
          <Alert tone="danger">{alertsErrorMessage(error, 'No se pudo cargar la alerta.')}</Alert>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted" role="status">
            <Spinner className="size-4" /> Cargando alerta…
          </p>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <Badge tone={STATUS_LABELS[alert.status].tone} dot>
              {STATUS_LABELS[alert.status].label}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-fg">
            <p>
              Se generó el {formatDate(alert.createdAt, true)}, cuando el disponible llegó al punto
              de reorden.
            </p>
            {alert.status === 'open' && alert.updatedAt !== alert.createdAt && (
              <p className="text-xs text-muted">
                Se actualizó el {formatDate(alert.updatedAt, true)}: sigue la existencia mientras
                esté pendiente.
              </p>
            )}
          </div>
          {alert.status === 'resolved' && alert.resolvedAt && (
            <Alert tone="success">
              {/* The time already ends in "p. m.": only a reason adds its own period. */}
              Se resolvió el {formatDate(alert.resolvedAt, true)}
              {alert.resolution ? `, porque ${RESOLUTION_LABELS[alert.resolution]}.` : ''}
            </Alert>
          )}

          <section aria-labelledby="alert-data">
            <h3 id="alert-data" className="text-sm font-bold text-fg">
              {alert.status === 'open' ? 'Lo que marca la alerta' : 'Antes de resolverse'}
            </h3>
            <dl className="divide-y divide-line2">
              <Item label="Disponible">
                <span className="tabular-nums">{amount(alert.available)}</span>
              </Item>
              <Item label="Punto de reorden">
                <span className="tabular-nums">{amount(alert.reorderPoint)}</span>{' '}
                <Badge appearance="outline" className="ml-1 rounded-lg font-medium">
                  {SOURCE_LABELS[alert.source].label}
                </Badge>
              </Item>
              <Item label="Severidad">
                {SEVERITY_LABELS[alert.severity].label}:{' '}
                {SEVERITY_LABELS[alert.severity].long.toLowerCase()}
              </Item>
              {alert.suggested > 0 && (
                <Item label="Sugerido reponer">
                  <span className="font-semibold tabular-nums">{amount(alert.suggested)}</span>
                  <p className="text-xs text-muted">
                    Lleva el disponible hasta el stock máximo, o hasta el punto de reorden si no hay
                    máximo.
                  </p>
                </Item>
              )}
            </dl>
          </section>

          <CurrentSituation alert={alert} enabled={showsStock} />
        </div>
      )}
    </Drawer>
  );
}

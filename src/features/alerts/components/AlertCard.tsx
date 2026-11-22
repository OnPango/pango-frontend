import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/units';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { RESOLUTION_LABELS, STATUS_LABELS, timeAgo } from '../content/alert.labels';
import type { StockAlert } from '../types/alerts.types';
import { SeverityBadge } from './SeverityBadge';

/** The edge color: how serious it is while pending, neutral once it is no longer. */
const EDGE = { 3: 'border-l-danger', 2: 'border-l-danger/60', 1: 'border-l-warning' } as const;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export interface AlertCardProps {
  alert: StockAlert;
  onOpen: (alert: StockAlert) => void;
  /** Only when the user reads stock in the alert's warehouse. */
  onShowInventory?: (alert: StockAlert) => void;
}

/** One alert as a card: severity, product, its numbers and, while pending, what to do next. */
export function AlertCard({ alert, onOpen, onShowInventory }: AlertCardProps) {
  const isOpen = alert.status === 'open';
  const { product, warehouse } = alert;
  const when = isOpen
    ? alert.updatedAt !== alert.createdAt
      ? `Actualizada ${timeAgo(alert.updatedAt)}`
      : capitalize(timeAgo(alert.createdAt))
    : `${STATUS_LABELS[alert.status].label} ${timeAgo(alert.resolvedAt ?? alert.updatedAt)}`;

  return (
    <article
      aria-label={`Alerta de ${product.name} en ${warehouse.name}`}
      className={cn(
        'flex w-full flex-wrap items-center justify-between gap-4 rounded-4xl border border-l-6 border-line2 bg-surface p-5',
        isOpen ? EDGE[alert.severity] : 'border-l-line2',
      )}
    >
      <div className="flex min-w-0 flex-[1_1_20rem] flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          {!isOpen && (
            <Badge tone={STATUS_LABELS[alert.status].tone}>
              {STATUS_LABELS[alert.status].label}
            </Badge>
          )}
          <span className="text-[13px] font-medium text-muted">{when}</span>
        </div>

        <p className="text-[17px] text-fg">
          <Button
            variant="ghost"
            onClick={() => onOpen(alert)}
            className="rounded-md p-0 text-left text-[17px] font-bold hover:bg-transparent hover:text-primary hover:underline"
            aria-label={`Ver la alerta de ${product.name} en ${warehouse.name}`}
          >
            {product.name}
          </Button>{' '}
          <span className="text-[13px] font-medium text-muted">· {product.sku}</span>
        </p>

        <p className="text-[15px] text-fg/85 tabular-nums">
          Disponible: <b>{formatQuantity(alert.available, product.unit)}</b> · Punto de reorden:{' '}
          <b>{formatQuantity(alert.reorderPoint, product.unit)}</b>
          <span className="text-muted"> · {warehouse.name}</span>
        </p>

        {alert.resolution && (
          <p className="text-[13px] font-medium text-muted">
            Se resolvió sola: {RESOLUTION_LABELS[alert.resolution]}.
          </p>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-wrap gap-2.5">
          <Button className="min-h-11 px-4.5 text-[15px]" onClick={() => onOpen(alert)}>
            Ver detalle
          </Button>
          {onShowInventory && (
            <Button
              variant="outline"
              className="min-h-11 border-primary px-4.5 text-[15px] text-primary hover:bg-primary/10"
              onClick={() => onShowInventory(alert)}
            >
              Ver inventario
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

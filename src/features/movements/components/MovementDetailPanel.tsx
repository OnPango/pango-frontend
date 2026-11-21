import { useState, type ReactNode } from 'react';
import { FiTruck } from 'react-icons/fi';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasPermissionIn } from '@/core/auth/permissions';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/units';
import { feedsDemand, movementTypeLabel } from '@/shared/lib/movementTypes';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Drawer } from '@/shared/ui/components/Drawer';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useMovement } from '../api/movements.queries';
import {
  formatDate,
  IN_TRANSIT_LABEL,
  isTransfer,
  lostQuantity,
  NATURE_LABELS,
  plainQuantity,
  requestNumberOf,
  signedQuantity,
  SOURCE_LABELS,
  warehousesText,
} from '../content/movement.labels';
import { movementsErrorMessage } from '../content/movements.errors';
import { MovementTypeLabel } from './MovementTypeLabel';
import { ReceiveTransferModal } from './ReceiveTransferModal';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

/**
 * One movement: its data and every line, with lot and location. It is never edited (RN-006); a
 * transfer on its way is received from here (CU-16).
 */
export function MovementDetailPanel({
  movementId,
  onClose,
}: {
  movementId: string;
  onClose: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const { data: movement, error } = useMovement(movementId);
  const [receiving, setReceiving] = useState(false);
  const requestNumber = movement ? requestNumberOf(movement) : null;
  const transfer = movement ? isTransfer(movement) : false;
  const canReceive =
    movement?.status === 'inTransit' &&
    movement.destination !== null &&
    hasPermissionIn(user, 'movement.receive', movement.destination.id);

  return (
    <Drawer
      title={movement ? movement.number : 'Movimiento'}
      description={
        movement ? `${movementTypeLabel(movement.type)} · ${warehousesText(movement)}` : undefined
      }
      onClose={onClose}
    >
      {!movement ? (
        error ? (
          <Alert tone="danger">
            {movementsErrorMessage(error, 'No se pudo cargar el movimiento.')}
          </Alert>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted" role="status">
            <Spinner className="size-4" /> Cargando movimiento…
          </p>
        )
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge appearance="outline" className="rounded-lg font-medium">
              <MovementTypeLabel type={movement.type} />
            </Badge>
            {movement.status === 'inTransit' && <Badge tone="secondary">{IN_TRANSIT_LABEL}</Badge>}
            {feedsDemand(movement.type, movement.source === 'stockRequest') && (
              <Badge tone="primary">Cuenta como demanda</Badge>
            )}
          </div>

          {movement.status === 'inTransit' && (
            <div className="space-y-3 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3">
              <p className="flex items-start gap-2 text-sm text-fg">
                <FiTruck aria-hidden className="mt-0.5 size-4 shrink-0 text-secondary" />
                <span>
                  Salió de {movement.warehouse.name} y va en camino a{' '}
                  {movement.destination?.name ?? 'su destino'}. Mientras tanto no está disponible en
                  ningún almacén.
                </span>
              </p>
              {canReceive ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setReceiving(true)}
                  className="w-full sm:w-auto"
                >
                  Recibir traslado
                </Button>
              ) : (
                <p className="text-xs text-muted">
                  Lo recibe alguien con permiso para recibir en{' '}
                  {movement.destination?.name ?? 'el destino'}.
                </p>
              )}
            </div>
          )}

          <section aria-labelledby="movement-data">
            <h3 id="movement-data" className="sr-only">
              Datos del movimiento
            </h3>
            <dl className="divide-y divide-line2">
              <Item label="Fecha">{formatDate(movement.occurredAt, true)}</Item>
              {transfer ? (
                <>
                  <Item label="Sale de">{movement.warehouse.name}</Item>
                  <Item label="Va a">{movement.destination?.name ?? '—'}</Item>
                </>
              ) : (
                <Item label="Almacén">{movement.warehouse.name}</Item>
              )}
              <Item label="Registró">{movement.registeredBy ?? '—'}</Item>
              {movement.received && (
                <Item label="Recibió">
                  {movement.received.by ?? '—'}
                  <span className="text-muted"> · {formatDate(movement.received.at, true)}</span>
                </Item>
              )}
              <Item label="Fuente">
                {movement.source === 'stockRequest' ? (
                  requestNumber ? (
                    <>
                      Atención de la solicitud{' '}
                      <span className="whitespace-nowrap tabular-nums">{requestNumber}</span>
                    </>
                  ) : (
                    'Atención de una solicitud'
                  )
                ) : (
                  SOURCE_LABELS.manual
                )}
              </Item>
              {movement.department && <Item label="Área">{movement.department.name}</Item>}
              {movement.documentRef && !requestNumber && (
                <Item label="Documento">{movement.documentRef}</Item>
              )}
              {movement.notes && <Item label="Notas">{movement.notes}</Item>}
            </dl>
          </section>

          <section aria-labelledby="movement-lines" className="space-y-2">
            <h3 id="movement-lines" className="text-sm font-bold text-fg">
              Productos
            </h3>
            <ul className="divide-y divide-line2 rounded-xl border border-line2">
              {movement.lines.map((line) => {
                const quantity = transfer ? null : signedQuantity([line]);
                const lost = lostQuantity(line);
                return (
                  <li
                    key={line.lineNumber}
                    className="flex items-start justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{line.product.name}</p>
                      <p className="text-xs text-muted">
                        {[
                          line.product.sku,
                          line.lot && `Lote ${line.lot}`,
                          !transfer &&
                            line.location &&
                            `${line.removes ? 'Desde' : 'En'} ${line.location === 'DEFAULT' ? 'la ubicación principal' : line.location}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      {line.receivedQuantity !== null && (
                        <p className={cn('text-xs', lost > 0 ? 'text-danger' : 'text-success')}>
                          {lost > 0
                            ? `Llegó ${formatQuantity(line.receivedQuantity, line.product.unit)}; faltó ${formatQuantity(lost, line.product.unit)}.`
                            : 'Llegó completo.'}
                        </p>
                      )}
                    </div>
                    {transfer ? (
                      <span className="text-sm font-semibold whitespace-nowrap text-fg tabular-nums">
                        {plainQuantity([line])}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-sm font-semibold whitespace-nowrap tabular-nums',
                          quantity?.sign === 1 ? 'text-success' : 'text-danger',
                        )}
                      >
                        {quantity?.text}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs text-muted">
            Los movimientos no se editan ni se borran. Un error se corrige con un movimiento de{' '}
            {NATURE_LABELS.adjustment.label.toLowerCase()}.
            {transfer && ' Un traslado se recibe una sola vez.'}
          </p>
        </div>
      )}
      {receiving && movement && (
        <ReceiveTransferModal
          movement={movement}
          onClose={() => setReceiving(false)}
          onReceived={() => setReceiving(false)}
        />
      )}
    </Drawer>
  );
}

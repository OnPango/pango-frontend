import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { feedsDemand, movementTypeLabel } from '@/shared/lib/movementTypes';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Drawer } from '@/shared/ui/components/Drawer';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useMovement } from '../api/movements.queries';
import {
  formatDate,
  NATURE_LABELS,
  requestNumberOf,
  signedQuantity,
  SOURCE_LABELS,
} from '../content/movement.labels';
import { movementsErrorMessage } from '../content/movements.errors';
import { MovementTypeLabel } from './MovementTypeLabel';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

/** One movement: its data and every line, with lot and location. It is never edited (RN-006). */
export function MovementDetailPanel({
  movementId,
  onClose,
}: {
  movementId: string;
  onClose: () => void;
}) {
  const { data: movement, error } = useMovement(movementId);
  const requestNumber = movement ? requestNumberOf(movement) : null;

  return (
    <Drawer
      title={movement ? movement.number : 'Movimiento'}
      description={
        movement ? `${movementTypeLabel(movement.type)} · ${movement.warehouse.name}` : undefined
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
            {feedsDemand(movement.type, movement.source === 'stockRequest') && (
              <Badge tone="primary">Cuenta como demanda</Badge>
            )}
          </div>

          <section aria-labelledby="movement-data">
            <h3 id="movement-data" className="sr-only">
              Datos del movimiento
            </h3>
            <dl className="divide-y divide-line2">
              <Item label="Fecha">{formatDate(movement.occurredAt, true)}</Item>
              <Item label="Almacén">{movement.warehouse.name}</Item>
              <Item label="Registró">{movement.registeredBy ?? '—'}</Item>
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
                const quantity = signedQuantity([line]);
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
                          line.location &&
                            `${line.removes ? 'Desde' : 'En'} ${line.location === 'DEFAULT' ? 'la ubicación principal' : line.location}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold whitespace-nowrap tabular-nums',
                        quantity?.sign === 1 ? 'text-success' : 'text-danger',
                      )}
                    >
                      {quantity?.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs text-muted">
            Los movimientos no se editan ni se borran. Un error se corrige con un movimiento de{' '}
            {NATURE_LABELS.adjustment.label.toLowerCase()}.
          </p>
        </div>
      )}
    </Drawer>
  );
}

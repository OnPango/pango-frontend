import { useState } from 'react';
import { FiArrowRight, FiTruck } from 'react-icons/fi';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import {
  formatDate,
  plainQuantity,
  productsSummary,
  warehousesText,
} from '../content/movement.labels';
import type { Movement } from '../types/movements.types';
import { ReceiveTransferModal } from './ReceiveTransferModal';

function TransferCard({
  movement,
  onOpen,
  onReceive,
}: {
  movement: Movement;
  onOpen: () => void;
  /** Only where the user may receive. */
  onReceive?: () => void;
}) {
  const products = new Set(movement.lines.map((line) => line.product.id)).size;
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-line2 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-0.5">
        <p className="flex flex-wrap items-center gap-x-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpen}
            className="h-auto p-0 font-semibold tabular-nums hover:bg-transparent hover:text-primary hover:underline"
            aria-label={`Ver el traslado ${movement.number}`}
          >
            {movement.number}
          </Button>
          <span className="truncate font-semibold text-fg">{productsSummary(movement.lines)}</span>
          <span className="text-muted tabular-nums">
            {products > 1 ? `${products} productos` : plainQuantity(movement.lines)}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <FiTruck aria-hidden className="size-3.5 shrink-0 text-secondary" />
          {warehousesText(movement)}
        </p>
        <p className="text-xs text-muted">
          Salió el {formatDate(movement.occurredAt, true)}
          {movement.registeredBy && ` · ${movement.registeredBy}`}
          {movement.documentRef && ` · ${movement.documentRef}`}
        </p>
      </div>
      {onReceive ? (
        <Button
          variant="primary"
          size="sm"
          onClick={onReceive}
          className="shrink-0 self-start sm:self-auto"
        >
          Recibir
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpen}
          className="shrink-0 gap-1.5 self-start text-muted sm:self-auto"
        >
          Ver detalle <FiArrowRight aria-hidden className="size-4" />
        </Button>
      )}
    </li>
  );
}

/**
 * CU-16: the transfers on their way. First those the user receives (their destination is a
 * warehouse where they hold `movement.receive`), then the ones they sent that are still travelling.
 */
export function TransfersOnTheWay({
  transfers,
  canReceiveIn,
  isLoading,
  error,
  onOpen,
}: {
  transfers: Movement[];
  canReceiveIn: (warehouseId: string) => boolean;
  isLoading: boolean;
  error?: string;
  onOpen: (movement: Movement) => void;
}) {
  const [receiving, setReceiving] = useState<Movement | null>(null);
  const toReceive = transfers.filter(
    (movement) => movement.destination && canReceiveIn(movement.destination.id),
  );
  const sent = transfers.filter((movement) => !toReceive.includes(movement));

  if (error) return <Alert tone="danger">{error}</Alert>;
  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Cargando traslados">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="to-receive" className="space-y-3">
        <h2 id="to-receive" className="text-sm font-bold text-fg">
          Por recibir
        </h2>
        {toReceive.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line2 px-6 py-8 text-center text-sm text-muted">
            No hay traslados en camino a tus almacenes.
          </p>
        ) : (
          <ul className="space-y-2">
            {toReceive.map((movement) => (
              <TransferCard
                key={movement.id}
                movement={movement}
                onOpen={() => onOpen(movement)}
                onReceive={() => setReceiving(movement)}
              />
            ))}
          </ul>
        )}
      </section>

      {sent.length > 0 && (
        <section aria-labelledby="still-travelling" className="space-y-3">
          <div>
            <h2 id="still-travelling" className="text-sm font-bold text-fg">
              Enviados, aún en camino
            </h2>
            <p className="text-xs text-muted">Los recibe alguien del almacén de destino.</p>
          </div>
          <ul className="space-y-2">
            {sent.map((movement) => (
              <TransferCard key={movement.id} movement={movement} onOpen={() => onOpen(movement)} />
            ))}
          </ul>
        </section>
      )}

      {receiving && (
        <ReceiveTransferModal
          movement={receiving}
          onClose={() => setReceiving(null)}
          onReceived={() => setReceiving(null)}
        />
      )}
    </div>
  );
}

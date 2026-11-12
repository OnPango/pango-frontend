import { useCallback, useEffect, useState } from 'react';
import { getApiErrorCode } from '@/core/api/errors';
import { formatQuantity } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Modal } from '@/shared/ui/components/Modal';
import { useFulfilRequest, useRequestLots } from '../api/requests.queries';
import { formatDate } from '../content/request.labels';
import { errorLine, requestsErrorMessage } from '../content/requests.errors';
import type { RequestableProduct, StockRequest } from '../types/requests.types';

type Line = StockRequest['lines'][number];

/** The lot of one per-lot line: the lots with stock, the earliest-expiring one that covers it first. */
function LotChoice({
  request,
  line,
  value,
  onChange,
  error,
}: {
  request: StockRequest;
  line: Line;
  value: string;
  onChange: (code: string) => void;
  error?: string;
}) {
  const lots = useRequestLots(line.product.id, request.warehouse.id, true);
  const items = lots.data ?? [];
  // FEFO suggestion: the API lists earliest expiry first; take the first lot that covers the line.
  const suggested = items.find((lot) => lot.onHand >= line.quantity)?.code ?? '';
  // The suggestion becomes the line's value (still editable), so confirming sends it.
  useEffect(() => {
    if (!value && suggested) onChange(suggested);
  }, [value, suggested, onChange]);
  const current = value;
  const chosen = items.find((lot) => lot.code === current);
  const short = chosen && chosen.onHand < line.quantity;

  return (
    <Select
      aria-label={`Lote de ${line.product.name}`}
      value={current}
      onChange={onChange}
      placeholder={
        lots.isLoading
          ? 'Cargando lotes…'
          : items.length > 0
            ? 'Elige el lote'
            : 'Sin lotes con existencia'
      }
      options={items.map((lot) => ({
        value: lot.code,
        label: lot.code,
        description: [
          formatQuantity(lot.onHand, line.product.unit),
          lot.expiryDate ? `vence el ${formatDate(lot.expiryDate)}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      }))}
      error={
        error ??
        (short
          ? `Este lote tiene ${formatQuantity(chosen.onHand, line.product.unit)}: no alcanza.`
          : undefined)
      }
      hint={current && current === suggested ? 'Sugerido: vence primero y alcanza.' : undefined}
    />
  );
}

/**
 * US-031: confirm the consumption of a request in attention. Stock is discounted and an outbound
 * movement with source "stock request" is registered, all or nothing.
 */
export function FulfilRequestModal({
  request,
  products,
  onClose,
  onDone,
}: {
  request: StockRequest;
  /** To know which lines take a lot. */
  products: RequestableProduct[];
  onClose: () => void;
  onDone: (request: StockRequest) => void;
}) {
  const fulfil = useFulfilRequest();
  const tracksLots = (productId: string) =>
    products.find((product) => product.id === productId)?.tracksLots ?? false;
  const lotLines = request.lines.filter((line) => tracksLots(line.product.id));

  // The lot of each per-lot line: the suggested one until the user picks another.
  const [lots, setLots] = useState<Record<number, string>>({});
  const [lineErrors, setLineErrors] = useState<Record<number, string>>({});
  const choose = useCallback((lineNumber: number, code: string) => {
    setLots((current) => ({ ...current, [lineNumber]: code }));
    setLineErrors((current) => ({ ...current, [lineNumber]: '' }));
  }, []);

  const errorAt = errorLine(fulfil.error);
  const apiLineError =
    errorAt !== null &&
    ['INSUFFICIENT_STOCK', 'LOT_REQUIRED', 'LOT_NOT_FOUND'].includes(
      getApiErrorCode(fulfil.error) ?? '',
    )
      ? errorAt
      : null;

  const confirm = () => {
    const missing: Record<number, string> = {};
    const chosen = lotLines.map((line) => ({
      lineNumber: line.lineNumber,
      lotCode: lots[line.lineNumber] ?? '',
    }));
    chosen.forEach((line) => {
      if (!line.lotCode) missing[line.lineNumber] = 'Elige el lote.';
    });
    if (Object.keys(missing).length > 0) {
      setLineErrors(missing);
      return;
    }
    setLineErrors({});
    fulfil.mutate({ id: request.id, input: { lines: chosen } }, { onSuccess: onDone });
  };

  return (
    <Modal
      title={`Confirmar consumo de ${request.number}`}
      description={`Sale de ${request.warehouse.name} para ${request.department.name}.`}
      size="lg"
      onClose={onClose}
      dismissible={!fulfil.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={fulfil.isPending}>
            Volver
          </Button>
          <Button variant="primary" size="sm" isLoading={fulfil.isPending} onClick={confirm}>
            Confirmar consumo
          </Button>
        </>
      }
    >
      <div className="space-y-5 text-sm">
        {fulfil.isError && apiLineError === null && (
          <Alert tone="danger">
            {requestsErrorMessage(fulfil.error, 'No se pudo confirmar el consumo.')}
          </Alert>
        )}
        <p>
          Se descuenta la existencia y se registra una salida de consumo interno a nombre de{' '}
          {request.department.name}; cuenta como demanda para el pronóstico. No se puede deshacer.
        </p>
        <ol className="divide-y divide-line2 rounded-xl border border-line2">
          {request.lines.map((line) => (
            <li
              key={line.lineNumber}
              className="grid grid-cols-1 items-start gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_14rem]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-fg">{line.product.name}</p>
                <p className="text-xs text-muted">{line.product.sku}</p>
              </div>
              <p className="font-semibold text-fg tabular-nums sm:pt-0.5">
                {formatQuantity(line.quantity, line.product.unit)}
              </p>
              {tracksLots(line.product.id) ? (
                <LotChoice
                  request={request}
                  line={line}
                  value={lots[line.lineNumber] ?? ''}
                  onChange={(code) => choose(line.lineNumber, code)}
                  error={
                    lineErrors[line.lineNumber] ||
                    (apiLineError === line.lineNumber
                      ? requestsErrorMessage(fulfil.error, '')
                      : undefined)
                  }
                />
              ) : (
                <p className="text-xs text-muted sm:pt-1">
                  {apiLineError === line.lineNumber
                    ? requestsErrorMessage(fulfil.error, '')
                    : 'Sin lote: sale de la ubicación principal.'}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </Modal>
  );
}

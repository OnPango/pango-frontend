import { useState } from 'react';
import { getApiErrorCode } from '@/core/api/errors';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useReceiveTransfer } from '../api/movements.queries';
import { movementsErrorMessage } from '../content/movements.errors';
import type { Movement } from '../types/movements.types';

const FORM_ID = 'receive-transfer-form';

/** From 0 up to 4 decimals; a comma works too. */
const QUANTITY = /^\d+([.,]\d{1,4})?$/;
const toNumber = (text: string) => Number(text.trim().replace(',', '.'));

/** Why a line's text cannot be received; null when it can. */
function problemOf(text: string, sent: number): string | null {
  if (!QUANTITY.test(text.trim())) return 'Escribe cuánto llegó: 0 o más, con hasta 4 decimales.';
  if (toNumber(text) > sent) return 'No puede llegar más de lo que se envió.';
  return null;
}

/**
 * CU-16: the destination says what arrived of each line. Everything, unless someone lowers a
 * line; what is short is recorded as lost on the way and does not go back to the origin.
 */
export function ReceiveTransferModal({
  movement,
  onClose,
  onReceived,
}: {
  movement: Movement;
  onClose: () => void;
  onReceived: (movement: Movement) => void;
}) {
  const receive = useReceiveTransfer();
  const [texts, setTexts] = useState<Record<number, string>>(() =>
    Object.fromEntries(movement.lines.map((line) => [line.lineNumber, String(line.quantity)])),
  );
  const [touched, setTouched] = useState(false);
  const destination = movement.destination?.name ?? 'el destino';

  const rows = movement.lines.map((line) => {
    const text = texts[line.lineNumber] ?? '';
    const problem = problemOf(text, line.quantity);
    const received = problem ? null : toNumber(text);
    const lost = received === null ? 0 : Number((line.quantity - received).toFixed(4));
    return { line, text, problem, received, lost };
  });
  const invalid = rows.some((row) => row.problem);
  const anyLost = rows.some((row) => row.lost > 0);

  const submit = () => {
    setTouched(true);
    if (invalid) return;
    receive.mutate(
      {
        id: movement.id,
        received: rows
          .filter((row) => row.lost > 0)
          .map((row) => ({ lineNumber: row.line.lineNumber, quantity: row.received ?? 0 })),
      },
      { onSuccess: onReceived },
    );
  };

  const error = receive.error
    ? getApiErrorCode(receive.error) === 'FORBIDDEN'
      ? `No tienes permiso para recibir en ${destination}.`
      : movementsErrorMessage(receive.error, 'No se pudo recibir el traslado.')
    : null;

  return (
    <Modal
      title={`Recibir ${movement.number}`}
      description={`De ${movement.warehouse.name} a ${destination}. Confirma cuánto llegó de cada producto.`}
      onClose={onClose}
      dismissible={!receive.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={receive.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="sm"
            isLoading={receive.isPending}
          >
            {anyLost ? 'Recibir con faltantes' : 'Recibir todo'}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {error && <Alert tone="danger">{error}</Alert>}

        <ul className="divide-y divide-line2 rounded-xl border border-line2">
          {rows.map(({ line, text, problem, lost }) => (
            <li
              key={line.lineNumber}
              className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[1fr_11rem] sm:items-start"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{line.product.name}</p>
                <p className="text-xs text-muted">
                  {[line.product.sku, line.lot && `Lote ${line.lot}`].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Se enviaron{' '}
                  <b className="font-semibold text-fg tabular-nums">
                    {formatQuantity(line.quantity, line.product.unit)}
                  </b>
                </p>
              </div>
              <TextBox
                label="Llegó"
                required
                inputMode="decimal"
                value={text}
                onChange={(event) => {
                  const value = event.target.value;
                  setTexts((current) => ({ ...current, [line.lineNumber]: value }));
                }}
                trailing={
                  <span className="text-xs text-muted">
                    {unitLabel(line.product.unit).toLowerCase()}
                  </span>
                }
                error={
                  touched || text !== String(line.quantity) ? (problem ?? undefined) : undefined
                }
                hint={
                  !problem && lost > 0
                    ? `Faltan ${formatQuantity(lost, line.product.unit)}.`
                    : undefined
                }
              />
            </li>
          ))}
        </ul>

        {anyLost ? (
          <Alert tone="warning">
            Lo que falta se registra como perdido en el camino: no vuelve a{' '}
            {movement.warehouse.name} y el traslado guarda cuánto se envió y cuánto llegó.
          </Alert>
        ) : (
          <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
            Se suma a la existencia de {destination} al recibirlo. Un traslado se recibe una sola
            vez.
          </p>
        )}
      </form>
    </Modal>
  );
}

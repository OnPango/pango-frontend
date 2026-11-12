import { getApiErrorCode } from '@/core/api/errors';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Modal } from '@/shared/ui/components/Modal';
import { useStartRequest } from '../api/requests.queries';
import { errorLine, requestsErrorMessage } from '../content/requests.errors';
import type { StockRequest } from '../types/requests.types';

/** Pending → in attention: confirms that the full quantity of every line gets reserved. */
export function StartAttentionDialog({
  request,
  onClose,
  onDone,
}: {
  request: StockRequest;
  onClose: () => void;
  onDone: (request: StockRequest) => void;
}) {
  const start = useStartRequest();
  // "Line 2: not enough available stock…": name the product instead of the line number.
  const short =
    getApiErrorCode(start.error) === 'INSUFFICIENT_STOCK'
      ? request.lines.find((line) => line.lineNumber === errorLine(start.error))
      : undefined;

  return (
    <Modal
      title={`¿Iniciar la atención de ${request.number}?`}
      size="sm"
      onClose={onClose}
      dismissible={!start.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={start.isPending}>
            Volver
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={start.isPending}
            onClick={() => start.mutate(request.id, { onSuccess: onDone })}
          >
            Iniciar atención
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        {start.isError && (
          <Alert tone="danger">
            {short
              ? `No hay suficiente existencia disponible de «${short.product.name}» en ${request.warehouse.name}.`
              : requestsErrorMessage(start.error, 'No se pudo iniciar la atención.')}
          </Alert>
        )}
        <p>
          Se reserva toda la cantidad de cada producto en {request.warehouse.name}. Mientras esté en
          atención, esa existencia no está disponible para otras solicitudes.
        </p>
        <p className="text-muted">La existencia se descuenta al confirmar el consumo.</p>
      </div>
    </Modal>
  );
}

import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Modal } from '@/shared/ui/components/Modal';
import { useCancelRequest } from '../api/requests.queries';
import { requestsErrorMessage } from '../content/requests.errors';
import type { StockRequest } from '../types/requests.types';

/** The requester cancels a request that is still pending (nothing was reserved yet). */
export function CancelRequestDialog({
  request,
  onClose,
  onDone,
}: {
  request: StockRequest;
  onClose: () => void;
  onDone: (request: StockRequest) => void;
}) {
  const cancel = useCancelRequest();
  return (
    <Modal
      title={`¿Cancelar la solicitud ${request.number}?`}
      size="sm"
      onClose={onClose}
      dismissible={!cancel.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={cancel.isPending}>
            Volver
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={cancel.isPending}
            onClick={() => cancel.mutate(request.id, { onSuccess: onDone })}
          >
            Cancelar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        {cancel.isError && (
          <Alert tone="danger">
            {requestsErrorMessage(cancel.error, 'No se pudo cancelar la solicitud.')}
          </Alert>
        )}
        <p>El almacén ya no la atenderá. Queda en la lista como cancelada y no se puede reabrir.</p>
      </div>
    </Modal>
  );
}

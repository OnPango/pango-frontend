import { useState } from 'react';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextArea } from '@/shared/ui/components/form/TextArea';
import { Modal } from '@/shared/ui/components/Modal';
import { useRejectRequest } from '../api/requests.queries';
import { requestsErrorMessage } from '../content/requests.errors';
import type { StockRequest } from '../types/requests.types';

/** Pending or in attention → rejected. The reason is required and shown to the requester. */
export function RejectRequestDialog({
  request,
  onClose,
  onDone,
}: {
  request: StockRequest;
  onClose: () => void;
  onDone: (request: StockRequest) => void;
}) {
  const reject = useRejectRequest();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    if (!reason.trim()) {
      setError('Escribe el motivo: quien la pidió lo verá.');
      return;
    }
    reject.mutate({ id: request.id, reason }, { onSuccess: onDone });
  };

  return (
    <Modal
      title={`¿Rechazar la solicitud ${request.number}?`}
      size="sm"
      onClose={onClose}
      dismissible={!reject.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={reject.isPending}>
            Volver
          </Button>
          <Button variant="danger" size="sm" isLoading={reject.isPending} onClick={confirm}>
            Rechazar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {reject.isError && (
          <Alert tone="danger">
            {requestsErrorMessage(reject.error, 'No se pudo rechazar la solicitud.')}
          </Alert>
        )}
        {request.status === 'inProgress' && <p>Se libera la existencia que tenía reservada.</p>}
        <TextArea
          label="Motivo"
          required
          maxLength={2000}
          placeholder="Ej. No hay existencia suficiente hasta la próxima compra."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />
      </div>
    </Modal>
  );
}

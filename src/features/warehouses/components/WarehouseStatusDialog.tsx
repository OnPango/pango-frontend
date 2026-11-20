import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Modal } from '@/shared/ui/components/Modal';
import { useUpdateWarehouse } from '../api/warehouses.queries';
import { warehousesErrorMessage } from '../content/warehouses.errors';
import type { Warehouse } from '../types/warehouses.types';

/**
 * Confirms closing or reopening a warehouse. Closing needs it empty: the API refuses with
 * `WAREHOUSE_HAS_STOCK`, shown here so the dialog stays open.
 */
export function WarehouseStatusDialog({
  warehouse,
  onClose,
  onDone,
}: {
  warehouse: Warehouse;
  onClose: () => void;
  onDone: (warehouse: Warehouse) => void;
}) {
  const update = useUpdateWarehouse();
  const closing = warehouse.isActive;

  const confirm = () =>
    update.mutate(
      { id: warehouse.id, input: { isActive: !closing } },
      { onSuccess: (saved) => onDone(saved) },
    );

  return (
    <Modal
      title={closing ? `¿Cerrar «${warehouse.name}»?` : `¿Reabrir «${warehouse.name}»?`}
      size="sm"
      onClose={onClose}
      dismissible={!update.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={update.isPending}>
            Cancelar
          </Button>
          <Button
            variant={closing ? 'danger' : 'primary'}
            size="sm"
            onClick={confirm}
            isLoading={update.isPending}
          >
            {closing ? 'Cerrar almacén' : 'Reabrir almacén'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {update.isError && (
          <Alert tone="danger">
            {warehousesErrorMessage(update.error, 'No se pudo cambiar el estado del almacén.')}
          </Alert>
        )}
        {closing ? (
          <>
            <p>Mientras esté cerrado:</p>
            <ul className="list-disc space-y-1 pl-5 text-fg/90">
              <li>No se podrán registrar entradas, salidas ni solicitudes en él.</li>
              <li>No se podrá usar en invitaciones ni en asignaciones de rol nuevas.</li>
            </ul>
            <p className="text-muted">
              Solo se puede cerrar si no tiene existencia. Nada se borra: puedes reabrirlo después.
            </p>
          </>
        ) : (
          <p>Volverá a estar disponible para movimientos, solicitudes, invitaciones y roles.</p>
        )}
      </div>
    </Modal>
  );
}

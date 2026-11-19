import { useState } from 'react';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Checkbox } from '@/shared/ui/components/form/Checkbox';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Modal } from '@/shared/ui/components/Modal';
import { useStartForecastRun } from '../api/forecast.queries';
import { forecastErrorMessage } from '../content/forecast.errors';
import type { Option } from '../types/forecast.types';

const ALL = 'all';

interface RunForecastModalProps {
  warehouses: Option[];
  /** The product open in the explorer, offered as the only one to forecast. */
  product: Option | null;
  /** A run is already in progress: another one would be refused. */
  running: boolean;
  onClose: () => void;
}

/** CU-10: start a forecast run, of every active product or a narrower scope. */
export function RunForecastModal({ warehouses, product, running, onClose }: RunForecastModalProps) {
  const start = useStartForecastRun();
  const [warehouseId, setWarehouseId] = useState(ALL);
  const [onlyProduct, setOnlyProduct] = useState(false);

  const submit = () =>
    start.mutate(
      {
        warehouseId: warehouseId === ALL ? null : warehouseId,
        productId: onlyProduct && product ? product.id : null,
      },
      { onSuccess: onClose },
    );

  return (
    <Modal
      title="Generar pronóstico"
      description="Estima la demanda de las próximas semanas con la historia hasta el último domingo completo."
      onClose={onClose}
      dismissible={!start.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={start.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={submit}
            isLoading={start.isPending}
            disabled={running}
          >
            Generar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {running && <Alert tone="info">Ya hay un pronóstico en curso. Espera a que termine.</Alert>}
        {start.error && (
          <Alert tone="danger">
            {forecastErrorMessage(start.error, 'No se pudo iniciar el pronóstico.')}
          </Alert>
        )}

        <Select
          label="Almacén"
          value={warehouseId}
          onChange={(value) => setWarehouseId(value || ALL)}
          options={[
            { value: ALL, label: 'Todos los almacenes' },
            ...warehouses.map((w) => ({ value: w.id, label: w.name })),
          ]}
          searchable={warehouses.length > 8}
          searchPlaceholder="Buscar almacén…"
          emptyMessage="Ningún almacén coincide"
        />
        {product && (
          <Checkbox
            label={`Solo ${product.name}`}
            description="Sin marcar, se pronostican todos los productos activos."
            checked={onlyProduct}
            onChange={(event) => setOnlyProduct(event.target.checked)}
          />
        )}

        <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
          Puede tardar unos minutos. Puedes seguir usando Pango: esta pantalla se actualiza sola
          cuando termine. Los pronósticos anteriores se conservan.
        </p>
      </div>
    </Modal>
  );
}

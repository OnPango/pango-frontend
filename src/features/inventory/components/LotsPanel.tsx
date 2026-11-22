import { useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { formatQuantity } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Drawer } from '@/shared/ui/components/Drawer';
import { DatePicker } from '@/shared/ui/components/form/date/DatePicker';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { useProductLots, useUpdateLotDates } from '../api/inventory.queries';
import { inventoryErrorMessage } from '../content/inventory.errors';
import type { ProductLot, StockProduct } from '../types/inventory.types';

/** The product and warehouse whose lots are shown. */
export interface LotsTarget {
  product: Pick<StockProduct, 'id' | 'name' | 'unit'>;
  warehouse: { id: string; name: string };
}

/** Lots about to expire within this many days are flagged. */
const SOON_DAYS = 30;

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));

/** Whole days from today (the user's) to `iso`: negative once it has passed. */
function daysUntil(iso: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = iso.split('-').map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - today) / 86_400_000);
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return null;
  const days = daysUntil(expiryDate);
  if (days < 0) {
    return (
      <Badge tone="danger" size="sm">
        Vencido
      </Badge>
    );
  }
  if (days > SOON_DAYS) return null;
  return (
    <Badge tone="warning" size="sm">
      {days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Vence en ${days} días`}
    </Badge>
  );
}

function LotDatesForm({
  productId,
  lot,
  onCancel,
  onSaved,
}: {
  productId: string;
  lot: ProductLot;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const update = useUpdateLotDates();
  const [manufactureDate, setManufactureDate] = useState(lot.manufactureDate ?? '');
  const [expiryDate, setExpiryDate] = useState(lot.expiryDate ?? '');
  const backwards = Boolean(manufactureDate && expiryDate && expiryDate < manufactureDate);
  const unchanged =
    manufactureDate === (lot.manufactureDate ?? '') && expiryDate === (lot.expiryDate ?? '');

  const save = () =>
    update.mutate(
      {
        productId,
        lotId: lot.id,
        manufactureDate: manufactureDate || null,
        expiryDate: expiryDate || null,
      },
      { onSuccess: onSaved },
    );

  return (
    <div className="mt-3 space-y-3 border-t border-line2 pt-3">
      {update.isError && (
        <Alert tone="danger">
          {inventoryErrorMessage(update.error, 'No se pudieron guardar las fechas del lote.')}
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePicker
          label="Fabricación"
          optional
          clearable
          value={manufactureDate}
          onChange={setManufactureDate}
          max={expiryDate || undefined}
          placeholder="Sin fecha"
        />
        <DatePicker
          label="Vencimiento"
          optional
          clearable
          value={expiryDate}
          onChange={setExpiryDate}
          min={manufactureDate || undefined}
          placeholder="Sin fecha"
          error={backwards ? 'No puede ser anterior a la fabricación.' : undefined}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={update.isPending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={save}
          isLoading={update.isPending}
          disabled={backwards || unchanged}
        >
          Guardar fechas
        </Button>
      </div>
    </div>
  );
}

/**
 * The lots of a product with stock in one warehouse, earliest expiry first, with their dates. Those
 * who manage products can set the dates: a lot is created by an inbound movement, which has none.
 */
export function LotsPanel({
  target,
  canEditDates,
  onClose,
}: {
  target: LotsTarget;
  canEditDates: boolean;
  onClose: () => void;
}) {
  const { product, warehouse } = target;
  const lots = useProductLots(product.id, warehouse.id);
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <Drawer title={`Lotes de ${product.name}`} description={warehouse.name} onClose={onClose}>
      <div className="space-y-4">
        <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
          Un lote agrupa las unidades que llegaron juntas, con el mismo vencimiento. Se crea al
          registrar una entrada con un código nuevo; aquí aparecen los que tienen existencia en este
          almacén, el que vence primero arriba.
        </p>

        {saved && (
          <Alert tone="success" onDismiss={() => setSaved(null)}>
            Fechas del lote {saved} guardadas.
          </Alert>
        )}
        {lots.isError && (
          <Alert tone="danger">
            {inventoryErrorMessage(lots.error, 'No se pudieron cargar los lotes.')}
          </Alert>
        )}

        {lots.isLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Cargando lotes">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        )}

        {lots.data?.length === 0 && (
          <p className="text-sm text-muted">No hay lotes con existencia en este almacén.</p>
        )}

        {lots.data && lots.data.length > 0 && (
          <ul className="space-y-3">
            {lots.data.map((lot) => (
              <li key={lot.id} className="rounded-2xl border border-line2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                      {lot.code}
                      <ExpiryBadge expiryDate={lot.expiryDate} />
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {lot.manufactureDate || lot.expiryDate
                        ? [
                            lot.manufactureDate && `Fabricado el ${formatDay(lot.manufactureDate)}`,
                            lot.expiryDate && `Vence el ${formatDay(lot.expiryDate)}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                        : 'Sin fechas registradas'}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-fg tabular-nums">
                    {formatQuantity(lot.onHand, product.unit)}
                  </p>
                </div>

                {canEditDates &&
                  (editing === lot.id ? (
                    <LotDatesForm
                      productId={product.id}
                      lot={lot}
                      onCancel={() => setEditing(null)}
                      onSaved={() => {
                        setEditing(null);
                        setSaved(lot.code);
                      }}
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSaved(null);
                        setEditing(lot.id);
                      }}
                      aria-label={`Editar las fechas del lote ${lot.code}`}
                      className="mt-2 -ml-2 gap-1.5"
                    >
                      <FiEdit2 aria-hidden className="size-4" /> Editar fechas
                    </Button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}

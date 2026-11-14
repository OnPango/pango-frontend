import { FiArrowDownLeft, FiArrowUpRight, FiClipboard, FiSliders } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import type { StockAction } from '../types/inventory.types';

/**
 * "Entrada" / "Salida" / "Ajuste" (and "Reposición") on a stock row, for its product and
 * warehouse.
 */
export function RowMovementActions({
  subject,
  onRegister,
  onReplenish,
  canAdd = true,
  canRemove,
}: {
  /** "Tornillo M8 en Bodega Central", for the accessible names. */
  subject: string;
  /** Without `movement.create` there are no movement actions. */
  onRegister?: (kind: StockAction) => void;
  /** With `replenishment.manage`: safety stock and reorder point (US-016). */
  onReplenish?: () => void;
  /** An archived product takes no movements. A count can find stock at zero, so it adjusts too. */
  canAdd?: boolean;
  /** Nothing to take out when the row is at zero. */
  canRemove: boolean;
}) {
  return (
    // Wraps onto two lines when the table is short of room, instead of overflowing it.
    <div className="flex flex-wrap items-center justify-end gap-1">
      {onRegister && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRegister('inbound')}
            disabled={!canAdd}
            className="gap-1 px-2 text-xs text-success hover:bg-success/10"
            aria-label={`Registrar entrada de ${subject}`}
          >
            <FiArrowDownLeft aria-hidden className="size-3.5" />
            Entrada
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRegister('outbound')}
            disabled={!canRemove}
            className="gap-1 px-2 text-xs text-danger hover:bg-danger/10"
            aria-label={`Registrar salida de ${subject}`}
          >
            <FiArrowUpRight aria-hidden className="size-3.5" />
            Salida
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRegister('adjustment')}
            disabled={!canAdd}
            className="gap-1 px-2 text-xs text-primary hover:bg-primary/10"
            aria-label={`Registrar ajuste de ${subject}`}
            title="Corregir la existencia con un conteo"
          >
            <FiClipboard aria-hidden className="size-3.5" />
            Ajuste
          </Button>
        </>
      )}
      {onReplenish && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReplenish}
          disabled={!canAdd}
          className="gap-1 px-2 text-xs text-muted hover:text-fg"
          aria-label={`Reposición de ${subject}`}
          title="Stock de seguridad y punto de reorden"
        >
          <FiSliders aria-hidden className="size-3.5" />
          Reposición
        </Button>
      )}
    </div>
  );
}

import { FiArrowDownLeft, FiArrowUpRight, FiSliders } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import type { MovementKind } from '../types/inventory.types';

/** "Entrada" / "Salida" (and "Reposición") on a stock row, for its product and warehouse. */
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
  onRegister?: (kind: MovementKind) => void;
  /** With `replenishment.manage`: safety stock and reorder point (US-016). */
  onReplenish?: () => void;
  /** An archived product takes no movements. */
  canAdd?: boolean;
  /** Nothing to take out when the row is at zero. */
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
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

import { FiArrowDownLeft, FiArrowUpRight } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import type { MovementKind } from '../types/inventory.types';

/** "Entrada" / "Salida" on a stock row, for the product and warehouse of that row. */
export function RowMovementActions({
  subject,
  onRegister,
  canAdd = true,
  canRemove,
}: {
  /** "Tornillo M8 en Bodega Central", for the accessible names. */
  subject: string;
  onRegister: (kind: MovementKind) => void;
  /** An archived product takes no movements. */
  canAdd?: boolean;
  /** Nothing to take out when the row is at zero. */
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
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
    </div>
  );
}

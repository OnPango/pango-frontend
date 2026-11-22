import { FiArrowRight } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { Button } from '@/shared/ui/components/Button';
import { EntityCard } from '@/shared/ui/components/EntityCard';
import type { Warehouse } from '../types/warehouses.types';
import { WarehouseStatusBadge, WarehouseTypeBadge } from './WarehouseTypeBadge';

export interface WarehouseCardProps {
  warehouse: Warehouse;
  onOpen: (warehouse: Warehouse) => void;
  /** Editing and closing need `warehouse.manage`; without them the card only opens the detail. */
  onEdit?: (warehouse: Warehouse) => void;
  onToggleStatus?: (warehouse: Warehouse) => void;
}

/** Warehouse/store card with SVG pattern banner, type/status badges and management actions. */
export function WarehouseCard({ warehouse, onOpen, onEdit, onToggleStatus }: WarehouseCardProps) {
  return (
    <EntityCard
      patternSeed={warehouse.id}
      isActive={warehouse.isActive}
      title={warehouse.name}
      subtitle={warehouse.code}
      badge={<WarehouseStatusBadge isActive={warehouse.isActive} />}
      footer={
        <>
          <Button
            variant="ghost"

            onClick={() => onOpen(warehouse)}
            aria-label={`Ver detalle de ${warehouse.name}`}
            className="gap-2"
          >
            Ver detalle <FiArrowRight aria-hidden className="size-4" />
          </Button>
          {onEdit && onToggleStatus && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => onToggleStatus(warehouse)}
                className={`text-xs ${
                  warehouse.isActive
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-success hover:bg-success/10'
                }`}
                aria-label={
                  warehouse.isActive ? `Cerrar ${warehouse.name}` : `Reabrir ${warehouse.name}`
                }
              >
                {warehouse.isActive ? 'Cerrar' : 'Reabrir'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onEdit(warehouse)}
                className="gap-1.5 p-1.5 text-muted hover:text-fg"
                aria-label={`Editar ${warehouse.name}`}
              >
                Editar
                <MdEdit aria-hidden className="size-4" />
              </Button>
            </div>
          )}
        </>
      }
    >
      <div>
        <WarehouseTypeBadge type={warehouse.type} />
      </div>
      <p className="line-clamp-2 min-h-10 text-sm text-muted">
        {warehouse.address ?? 'Sin dirección registrada.'}
      </p>
    </EntityCard>
  );
}

import { MdStorefront, MdWarehouse } from 'react-icons/md';
import { Badge } from '@/shared/ui/components/Badge';
import { TYPE_LABELS } from '../content/warehouse.labels';
import type { WarehouseType } from '../types/warehouses.types';

export function WarehouseTypeBadge({ type }: { type: WarehouseType }) {
  return (
    <Badge
      icon={type === 'store' ? MdStorefront : MdWarehouse}
      appearance="outline"
      className="rounded-lg font-medium"
    >
      {TYPE_LABELS[type]}
    </Badge>
  );
}

export function WarehouseStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge tone={isActive ? 'success' : 'neutral'} dot>
      {isActive ? 'Activo' : 'Cerrado'}
    </Badge>
  );
}

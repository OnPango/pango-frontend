import type { ReactNode } from 'react';
import { MdEdit } from 'react-icons/md';
import { Button } from '@/shared/ui/components/Button';
import { Drawer } from '@/shared/ui/components/Drawer';
import { formatDate } from '../content/warehouse.labels';
import type { Warehouse } from '../types/warehouses.types';
import { WarehouseStatusBadge, WarehouseTypeBadge } from './WarehouseTypeBadge';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

/** CU-04 A1: one warehouse's data, with its actions for `warehouse.manage`. */
export function WarehouseDetailPanel({
  warehouse,
  canManage,
  onClose,
  onEdit,
  onToggleStatus,
}: {
  warehouse: Warehouse;
  canManage: boolean;
  onClose: () => void;
  onEdit: (warehouse: Warehouse) => void;
  onToggleStatus: (warehouse: Warehouse) => void;
}) {
  return (
    <Drawer
      title={warehouse.name}
      description={warehouse.code}
      onClose={onClose}
      footer={
        canManage ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus(warehouse)}
              className={
                warehouse.isActive
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-success hover:bg-success/10'
              }
            >
              {warehouse.isActive ? 'Cerrar almacén' : 'Reabrir almacén'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => onEdit(warehouse)} className="gap-2">
              <MdEdit aria-hidden className="size-4" />
              Editar
            </Button>
          </>
        ) : undefined
      }
    >
      <section aria-labelledby="warehouse-data" className="space-y-1">
        <h3 id="warehouse-data" className="sr-only">
          Datos del almacén
        </h3>
        <dl className="divide-y divide-line2">
          <Item label="Tipo">
            <WarehouseTypeBadge type={warehouse.type} />
          </Item>
          <Item label="Estado">
            <WarehouseStatusBadge isActive={warehouse.isActive} />
          </Item>
          <Item label="Código">{warehouse.code}</Item>
          <Item label="Dirección">
            {warehouse.address ?? <span className="text-muted">Sin dirección</span>}
          </Item>
          <Item label="Creado">{formatDate(warehouse.createdAt)}</Item>
        </dl>
      </section>

      <section aria-labelledby="warehouse-locations" className="mt-6 space-y-2">
        <h3 id="warehouse-locations" className="text-sm font-bold text-fg">
          Ubicaciones
        </h3>
        <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
          Por ahora todo el inventario de este almacén va a su ubicación principal
          {warehouse.defaultLocation && ` (${warehouse.defaultLocation.code})`}. Los estantes, racks
          y zonas llegan más adelante.
        </p>
      </section>
    </Drawer>
  );
}

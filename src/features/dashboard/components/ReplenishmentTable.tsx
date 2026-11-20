import { useState, useMemo } from 'react';
import { FiAlertCircle, FiBox } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import type { Column } from '@/shared/types/dataTable';
import type { ReplenishmentProduct, StockStatus } from '../types/dashboard.types';

interface ReplenishmentTableProps {
  products: ReplenishmentProduct[];
}

const STATUS_BADGES: Record<
  StockStatus,
  { tone: 'danger' | 'warning' | 'success'; label: string }
> = {
  critico: { tone: 'danger', label: 'Crítico' },
  preventivo: { tone: 'warning', label: 'Preventivo' },
  normal: { tone: 'success', label: 'Normal' },
};

function getStatusBadge(status: StockStatus) {
  const { tone, label } = STATUS_BADGES[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

export function ReplenishmentTable({ products }: ReplenishmentTableProps) {
  const [filter, setFilter] = useState<'all' | StockStatus>('all');

  const filteredProducts = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p) => p.status === filter);
  }, [products, filter]);

  const criticalCount = products.filter((p) => p.status === 'critico').length;
  const preventiveCount = products.filter((p) => p.status === 'preventivo').length;

  const columns: Column<ReplenishmentProduct>[] = [
    {
      key: 'product',
      header: 'Productos',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-line2/30 text-fg"
            aria-hidden="true"
          >
            <FiBox className="size-4 text-muted" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{row.name}</p>
            <p className="truncate text-xs text-muted">
              {row.sku} · <span className="font-light">{row.category}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Existencia',
      cell: (row) => (
        <div className="font-semibold text-fg">
          {row.currentStock} <span className="text-xs font-normal text-muted">{row.unit}</span>
        </div>
      ),
    },
    {
      key: 'reorderPoint',
      header: 'Punto de reorden',
      cell: (row) => (
        <div className="font-medium text-fg">
          {row.reorderPoint} <span className="text-xs font-normal text-muted">{row.unit}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      cell: (row) => getStatusBadge(row.status),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Table Section Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
              Productos por reponer
            </h2>
            {criticalCount > 0 && (
              <Badge tone="danger" icon={FiAlertCircle}>
                {criticalCount} en crítico
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted sm:text-sm">
            Monitoreo y seguimiento de inventario que requiere abastecimiento
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 self-start rounded-xl border border-line2/60 bg-surface p-1 text-xs font-medium sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={cn(
              'rounded-lg font-medium',
              filter === 'all'
                ? 'bg-primary text-primary-fg shadow-xs hover:bg-primary'
                : 'text-muted hover:bg-transparent hover:text-fg',
            )}
          >
            Todos ({products.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('critico')}
            aria-pressed={filter === 'critico'}
            className={cn(
              'rounded-lg font-medium',
              filter === 'critico'
                ? 'bg-danger text-primary-fg shadow-xs hover:bg-danger'
                : 'text-muted hover:bg-transparent hover:text-fg',
            )}
          >
            Crítico ({criticalCount})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('preventivo')}
            aria-pressed={filter === 'preventivo'}
            className={cn(
              'rounded-lg font-medium',
              filter === 'preventivo'
                ? 'bg-warning text-primary-fg shadow-xs hover:bg-warning'
                : 'text-muted hover:bg-transparent hover:text-fg',
            )}
          >
            Preventivo ({preventiveCount})
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={filteredProducts}
        getRowKey={(row) => row.id}
        caption="Lista de productos por reponer"
        emptyMessage="No hay productos que requieran reposición en esta categoría."
      />
    </div>
  );
}

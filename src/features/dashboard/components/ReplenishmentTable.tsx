import { useState, useMemo } from 'react';
import { FiAlertCircle, FiBox } from 'react-icons/fi';
import { DataTable } from '@/shared/ui/components/DataTable';
import type { Column } from '@/shared/types/dataTable';
import type { ReplenishmentProduct, StockStatus } from '../types/dashboard.types';

interface ReplenishmentTableProps {
  products: ReplenishmentProduct[];
}

function getStatusBadge(status: StockStatus) {
  switch (status) {
    case 'critico':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-0.5 text-xs font-semibold text-danger">
          <span className="size-1.5 rounded-full bg-danger" />
          Crítico
        </span>
      );
    case 'preventivo':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-0.5 text-xs font-semibold text-warning">
          <span className="size-1.5 rounded-full bg-warning" />
          Preventivo
        </span>
      );
    case 'normal':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-0.5 text-xs font-semibold text-success">
          <span className="size-1.5 rounded-full bg-success" />
          Normal
        </span>
      );
  }
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
          {row.currentStock}{' '}
          <span className="text-xs font-normal text-muted">{row.unit}</span>
        </div>
      ),
    },
    {
      key: 'reorderPoint',
      header: 'Punto de reorden',
      cell: (row) => (
        <div className="font-medium text-fg">
          {row.reorderPoint}{' '}
          <span className="text-xs font-normal text-muted">{row.unit}</span>
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
              <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
                <FiAlertCircle className="size-3" />
                {criticalCount} en crítico
              </span>
            )}
          </div>
          <p className="text-xs text-muted sm:text-sm">
            Monitoreo y seguimiento de inventario que requiere abastecimiento
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 self-start rounded-xl border border-line2/60 bg-surface p-1 text-xs font-medium sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-fg shadow-xs'
                : 'text-muted hover:text-fg'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('critico')}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              filter === 'critico'
                ? 'bg-danger text-primary-fg shadow-xs'
                : 'text-muted hover:text-fg'
            }`}
          >
            Crítico ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('preventivo')}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              filter === 'preventivo'
                ? 'bg-warning text-primary-fg shadow-xs'
                : 'text-muted hover:text-fg'
            }`}
          >
            Preventivo ({preventiveCount})
          </button>
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

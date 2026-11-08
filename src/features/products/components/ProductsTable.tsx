import { useMemo } from 'react';
import { FiLayers } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { TbHash } from 'react-icons/tb';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { HeaderTip } from '@/shared/ui/components/HeaderTip';
import { formatMeasures, unitLabel } from '../content/catalog.labels';
import { PAGE_SIZES } from '../hooks/useProductFilters';
import type { Product } from '../types/products.types';

const COLUMNS: Column<Product>[] = [
  {
    key: 'product',
    header: 'Producto',
    cell: (product) => (
      <div className="min-w-0">
        <p className="truncate font-semibold text-fg">{product.name}</p>
        <p className="truncate text-xs text-muted">
          {product.sku} · {unitLabel(product.stockUnit).toLowerCase()}
        </p>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Familia',
    cell: (product) => <span className="text-sm text-fg/90">{product.category.name}</span>,
  },
  {
    key: 'measures',
    header: 'Medidas',
    cell: (product) => <span className="text-xs text-muted">{formatMeasures(product) ?? '—'}</span>,
  },
  {
    key: 'tracking',
    header: (
      <span className="inline-flex items-center">
        Seguimiento
        <HeaderTip label="¿Qué es el seguimiento?" title="Seguimiento">
          Cómo se identifica cada unidad: <b>por lote</b> (un código cubre varias) o{' '}
          <b>solo cantidad</b> (solo importa cuántas hay).
        </HeaderTip>
      </span>
    ),
    cell: (product) =>
      product.tracksLots ? (
        <Badge icon={FiLayers} appearance="outline" className="rounded-lg font-medium">
          Por lote
        </Badge>
      ) : (
        <Badge icon={TbHash} appearance="outline" className="rounded-lg font-medium">
          Solo cantidad
        </Badge>
      ),
  },
  {
    key: 'status',
    header: 'Estado',
    cell: (product) => (
      <Badge tone={product.isActive ? 'success' : 'neutral'} dot>
        {product.isActive ? 'Activo' : 'Archivado'}
      </Badge>
    ),
  },
];

export interface ProductsTableProps {
  products: Product[];
  isLoading?: boolean;
  error?: string;
  emptyMessage?: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Shown only with `product.manage`; without it the table is read-only. */
  onEdit?: (product: Product) => void;
}

export function ProductsTable({
  products,
  isLoading = false,
  error,
  emptyMessage = 'No hay productos para mostrar.',
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onEdit,
}: ProductsTableProps) {
  const columns = useMemo<Column<Product>[]>(
    () =>
      onEdit
        ? [
            ...COLUMNS,
            {
              key: 'edit',
              header: <span className="sr-only">Acciones</span>,
              className: 'text-right',
              cell: (product) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="gap-2 p-1.5 text-muted hover:text-fg"
                  aria-label={`Editar ${product.name}`}
                >
                  Editar
                  <MdEdit aria-hidden className="size-4" />
                </Button>
              ),
            },
          ]
        : COLUMNS,
    [onEdit],
  );

  return (
    <DataTable<Product>
      caption="Productos del catálogo de la organización"
      isLoading={isLoading}
      error={error}
      emptyMessage={emptyMessage}
      getRowKey={(product) => product.id}
      columns={columns}
      rows={products}
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
        pageSizeOptions: [...PAGE_SIZES],
        onPageSizeChange,
      }}
    />
  );
}

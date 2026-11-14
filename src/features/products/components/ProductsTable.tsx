import { useMemo } from 'react';
import { FiLayers } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { TbHash } from 'react-icons/tb';
import { unitLabel } from '@/shared/lib/units';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { HeaderTip } from '@/shared/ui/components/HeaderTip';
import { formatMeasures } from '../content/catalog.labels';
import { PAGE_SIZES } from '../hooks/useProductFilters';
import type { Product } from '../types/products.types';

/** The name opens the product's detail panel. */
const productColumn = (onOpen: (product: Product) => void): Column<Product> => ({
  key: 'product',
  skeleton: 'title',
  header: 'Producto',
  cell: (product) => (
    <div className="min-w-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onOpen(product)}
        className="max-w-full justify-start truncate rounded-md p-0 text-left text-sm hover:bg-transparent hover:text-primary hover:underline"
        aria-label={`Ver detalle de ${product.name}`}
      >
        {product.name}
      </Button>
      <p className="truncate text-xs text-muted">
        {product.sku} · {unitLabel(product.stockUnit).toLowerCase()}
      </p>
    </div>
  ),
});

const COLUMNS: Column<Product>[] = [
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
    skeleton: 'badge',
    header: (
      <span className="inline-flex items-center">
        Seguimiento
        <HeaderTip label="¿Qué es el seguimiento?" title="Seguimiento">
          Cómo se lleva la existencia: <b>por lote</b> (las unidades que llegan juntas comparten
          código y vencimiento) o <b>solo cantidad</b> (solo importa cuántas hay).
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
    skeleton: 'badge',
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
  onOpen: (product: Product) => void;
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
  onOpen,
  onEdit,
}: ProductsTableProps) {
  const columns = useMemo<Column<Product>[]>(
    () =>
      onEdit
        ? [
            productColumn(onOpen),
            ...COLUMNS,
            {
              key: 'edit',
              skeleton: 'button',
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
        : [productColumn(onOpen), ...COLUMNS],
    [onOpen, onEdit],
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

import type { ReactNode } from 'react';
import { FiArrowRight, FiLayers } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { TbHash } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { formatMoney, formatUnitCost } from '@/shared/lib/money';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Drawer } from '@/shared/ui/components/Drawer';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useProduct } from '../api/products.queries';
import { formatMeasures } from '../content/catalog.labels';
import { productsErrorMessage } from '../content/products.errors';
import type { Product } from '../types/products.types';

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-fg">{children}</dd>
    </div>
  );
}

/**
 * A product's data and its stock across every warehouse (US-015). The split per warehouse lives in
 * Inventario, linked from here.
 */
export function ProductDetailPanel({
  product,
  familyPath,
  canManage,
  canSeeStockPerWarehouse,
  canSeeMovements,
  onClose,
  onEdit,
}: {
  product: Product;
  /** "Ferretería › Tornillería". */
  familyPath: string;
  canManage: boolean;
  /** `stock.read`: the link to Inventario. */
  canSeeStockPerWarehouse: boolean;
  /** With `movement.read`: a link to the product's movement history (US-014). */
  canSeeMovements: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
}) {
  const detail = useProduct(product.id);
  const measures = formatMeasures(product);

  return (
    <Drawer
      title={product.name}
      description={product.sku}
      onClose={onClose}
      footer={
        canManage ? (
          <Button variant="primary" onClick={() => onEdit(product)} className="gap-2">
            <MdEdit aria-hidden className="size-4" />
            Editar
          </Button>
        ) : undefined
      }
    >
      <section
        aria-labelledby="product-stock"
        className="space-y-2 rounded-2xl border border-line2 bg-canvas p-4"
      >
        <h3 id="product-stock" className="text-xs font-semibold text-muted">
          Existencia total
        </h3>
        {detail.data ? (
          <p className="text-3xl font-bold text-fg tabular-nums">
            {formatQuantity(detail.data.totalOnHand, product.stockUnit)}
          </p>
        ) : detail.error ? (
          <Alert tone="danger">
            {productsErrorMessage(detail.error, 'No se pudo cargar la existencia.')}
          </Alert>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted" role="status">
            <Spinner className="size-4" /> Cargando existencia…
          </p>
        )}
        <p className="text-xs text-muted">Suma de todos los almacenes.</p>
        {detail.data && (
          <dl className="grid grid-cols-2 gap-3 border-t border-line2 pt-3">
            <div>
              <dt className="text-xs font-semibold text-muted">Costo promedio</dt>
              <dd className="text-sm font-semibold text-fg tabular-nums">
                {detail.data.averageCost > 0 ? (
                  <>
                    {formatUnitCost(detail.data.averageCost)}{' '}
                    <span className="font-normal text-muted">
                      por {unitLabel(product.stockUnit).toLowerCase()}
                    </span>
                  </>
                ) : (
                  <span className="font-normal text-muted">Sin costo registrado</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Valor en existencia</dt>
              <dd className="text-sm font-semibold text-fg tabular-nums">
                {formatMoney(Math.max(detail.data.totalOnHand, 0) * detail.data.averageCost)}
              </dd>
            </div>
          </dl>
        )}
        {detail.data && detail.data.averageCost === 0 && detail.data.totalOnHand > 0 && (
          <p className="text-xs text-muted">
            Se calcula con el costo unitario de las entradas. Registra la próxima entrada con su
            costo para valorar este producto.
          </p>
        )}
        {canSeeStockPerWarehouse && (
          <Link
            to={`/inventory?product=${product.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Ver existencia por almacén
            <FiArrowRight aria-hidden className="size-4" />
          </Link>
        )}
        {canSeeMovements && (
          <Link
            to={`/movements?product=${product.id}`}
            className="flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Ver sus movimientos
            <FiArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </section>

      <section aria-labelledby="product-data" className="mt-6">
        <h3 id="product-data" className="sr-only">
          Datos del producto
        </h3>
        <dl className="divide-y divide-line2">
          <Item label="Estado">
            <Badge tone={product.isActive ? 'success' : 'neutral'} dot>
              {product.isActive ? 'Activo' : 'Archivado'}
            </Badge>
          </Item>
          <Item label="Código">{product.sku}</Item>
          <Item label="Familia">{familyPath}</Item>
          <Item label="Unidad de medida">{unitLabel(product.stockUnit)}</Item>
          <Item label="Seguimiento">
            {product.tracksLots ? (
              <Badge icon={FiLayers} appearance="outline" className="rounded-lg font-medium">
                Por lote
              </Badge>
            ) : (
              <Badge icon={TbHash} appearance="outline" className="rounded-lg font-medium">
                Solo cantidad
              </Badge>
            )}
          </Item>
          <Item label="Medidas">{measures ?? <span className="text-muted">Sin medidas</span>}</Item>
          <Item label="Descripción">
            {product.description ?? <span className="text-muted">Sin descripción</span>}
          </Item>
        </dl>
      </section>
    </Drawer>
  );
}

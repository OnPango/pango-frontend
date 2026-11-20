import { FiArrowRight, FiLayers } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { TbHash } from 'react-icons/tb';
import { unitLabel } from '@/shared/lib/units';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { EntityCard } from '@/shared/ui/components/EntityCard';
import { formatMeasures } from '../content/catalog.labels';
import type { Product } from '../types/products.types';

export interface ProductCardProps {
  product: Product;
  /** Hierarchical family name ("Ferretería › Tornillería"). Defaults to `product.category.name`. */
  familyPath?: string;
  onOpen: (product: Product) => void;
  /** Shown only with `product.manage`; without it the card is read-only. */
  onEdit?: (product: Product) => void;
}

/** Catalog product card with SVG pattern banner, metadata badges, and detail/edit actions. */
export function ProductCard({ product, familyPath, onOpen, onEdit }: ProductCardProps) {
  const measures = formatMeasures(product);

  return (
    <EntityCard
      patternSeed={product.id}
      isActive={product.isActive}
      title={product.name}
      subtitle={`${product.sku} · ${unitLabel(product.stockUnit).toLowerCase()}`}
      badge={
        <Badge tone={product.isActive ? 'success' : 'neutral'} dot>
          {product.isActive ? 'Activo' : 'Archivado'}
        </Badge>
      }
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpen(product)}
            aria-label={`Ver detalle de ${product.name}`}
            className="gap-2"
          >
            Ver detalle <FiArrowRight aria-hidden className="size-4" />
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(product)}
              className="gap-1.5 p-1.5 text-muted hover:text-fg"
              aria-label={`Editar ${product.name}`}
            >
              Editar
              <MdEdit aria-hidden className="size-4" />
            </Button>
          )}
        </>
      }
    >
      <p className="line-clamp-2 min-h-10 text-sm text-muted">
        {product.description ?? 'Sin descripción.'}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge appearance="outline" className="max-w-full truncate rounded-lg font-medium">
          {familyPath ?? product.category.name}
        </Badge>
        {product.tracksLots ? (
          <Badge icon={FiLayers} appearance="outline" className="rounded-lg font-medium">
            Por lote
          </Badge>
        ) : (
          <Badge icon={TbHash} appearance="outline" className="rounded-lg font-medium">
            Solo cantidad
          </Badge>
        )}
      </div>
      {measures && <p className="text-xs text-muted">{measures}</p>}
    </EntityCard>
  );
}

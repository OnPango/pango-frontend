import { FiArrowRight } from 'react-icons/fi';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { CardPatternBanner, EntityCard } from '@/shared/ui/components/EntityCard';
import type { ProductCategory } from '../types/products.types';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The picture of a family, cropped to its container. Decorative: the name is next to it. */
export function FamilyPicture({
  category,
  className,
}: {
  category: ProductCategory;
  className?: string;
}) {
  return (
    <CardPatternBanner seed={category.id} isActive={category.isActive} className={className} />
  );
}

export interface FamilyCardProps {
  category: ProductCategory;
  /** Its products plus those of its subfamilies. */
  productCount: number;
  /** Subfamilies below it, at any depth. */
  subfamilyCount: number;
  /** Subfamilies that match the search or the status filter when the family itself does not. */
  matches?: string[];
  onOpen: (category: ProductCategory) => void;
}

/** A top-level family as a card. Its subfamilies are not listed: "Ver detalle" shows them. */
export function FamilyCard({
  category,
  productCount,
  subfamilyCount,
  matches = [],
  onOpen,
}: FamilyCardProps) {
  const shown = matches.slice(0, 2).join(', ');
  const more = matches.length - 2;

  return (
    <EntityCard
      patternSeed={category.id}
      isActive={category.isActive}
      title={category.name}
      badge={
        <Badge tone={category.isActive ? 'success' : 'neutral'} dot>
          {category.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      }
      footer={
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpen(category)}
          aria-label={`Ver el detalle de ${category.name}`}
          className="gap-2"
        >
          Ver detalle <FiArrowRight aria-hidden className="size-4" />
        </Button>
      }
    >
      <p className="line-clamp-2 min-h-10 text-sm text-muted">
        {category.description ?? 'Sin descripción.'}
      </p>
      <p className="text-sm text-fg/90">
        <span className="font-semibold tabular-nums">
          {count(productCount, 'producto', 'productos')}
        </span>
        <span aria-hidden className="mx-2 text-muted">
          ·
        </span>
        {subfamilyCount > 0
          ? count(subfamilyCount, 'subfamilia', 'subfamilias')
          : 'Sin subfamilias'}
      </p>
      {matches.length > 0 && (
        <p className="text-xs text-muted">
          Coincide en: {shown}
          {more > 0 ? ` y ${more} más` : ''}
        </p>
      )}
    </EntityCard>
  );
}

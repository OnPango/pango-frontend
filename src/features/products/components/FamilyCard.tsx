import { FiArrowRight } from 'react-icons/fi';
import { useThemeStore } from '@/core/theme/theme.store';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { familyBackground } from '../content/familyBackgrounds';
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
  const theme = useThemeStore((state) => state.resolved);
  const { src, dimmed } = familyBackground(category.id, theme);
  return (
    <div className={cn('overflow-hidden bg-canvas', className)}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(
          'size-full object-cover',
          dimmed && 'brightness-75',
          !category.isActive && 'opacity-60 grayscale',
        )}
      />
    </div>
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
    <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-line2 bg-surface transition-transform duration-300 hover:scale-105">
      <FamilyPicture category={category} className="h-28" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-lg leading-tight font-bold wrap-break-word text-fg">
            {category.name}
          </h3>
          <Badge tone={category.isActive ? 'success' : 'neutral'} dot className="shrink-0">
            {category.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpen(category)}
          aria-label={`Ver el detalle de ${category.name}`}
          className="mt-auto gap-2 self-start"
        >
          Ver detalle <FiArrowRight aria-hidden className="size-4" />
        </Button>
      </div>
    </article>
  );
}

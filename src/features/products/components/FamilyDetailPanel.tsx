import { useMemo } from 'react';
import { FiPlus } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Drawer } from '@/shared/ui/components/Drawer';
import { categoryPaths, categoryTree, withDescendants } from '../content/catalog.labels';
import type { ProductCategory } from '../types/products.types';
import { FamilyPicture } from './FamilyCard';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface FamilyActions {
  onEdit: (category: ProductCategory) => void;
  onChangeStatus: (category: ProductCategory) => void;
  onNewSubfamily: (parent: ProductCategory) => void;
}

function StatusButton({
  category,
  onChangeStatus,
}: {
  category: ProductCategory;
  onChangeStatus: FamilyActions['onChangeStatus'];
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onChangeStatus(category)}
      className={`text-xs ${
        category.isActive ? 'text-danger hover:bg-danger/10' : 'text-success hover:bg-success/10'
      }`}
      aria-label={category.isActive ? `Desactivar ${category.name}` : `Reactivar ${category.name}`}
    >
      {category.isActive ? 'Desactivar' : 'Reactivar'}
    </Button>
  );
}

/**
 * A family with what the cards leave out: its description, its products and its subfamilies as a
 * tree. With `actions` (those who manage families) each one can be edited, (de)activated or given
 * a subfamily from here.
 */
export function FamilyDetailPanel({
  category,
  categories,
  notice,
  onDismissNotice,
  actions,
  onClose,
}: {
  category: ProductCategory;
  categories: ProductCategory[];
  /** What the last action did; the page's own notice is behind this panel. */
  notice?: string | null;
  onDismissNotice?: () => void;
  /** Absent: read-only. */
  actions?: FamilyActions;
  onClose: () => void;
}) {
  const { subfamilies, productsBelow, path } = useMemo(() => {
    const below = withDescendants(categories, category.id);
    const descendants = categories.filter(
      (other) => other.id !== category.id && below.has(other.id),
    );
    return {
      // Their parent is not in the list, so the direct subfamilies start the tree.
      subfamilies: categoryTree(descendants),
      productsBelow: descendants.reduce((sum, other) => sum + other.productCount, 0),
      path: categoryPaths(categories).get(category.id) ?? category.name,
    };
  }, [categories, category]);

  const total = category.productCount + productsBelow;

  return (
    <Drawer
      title={category.name}
      description={category.parentId ? path : 'Familia principal'}
      onClose={onClose}
      footer={
        actions && (
          <>
            <StatusButton category={category} onChangeStatus={actions.onChangeStatus} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onEdit(category)}
              className="gap-2"
            >
              <MdEdit aria-hidden className="size-4" /> Editar familia
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {notice && (
          <Alert tone="success" onDismiss={onDismissNotice}>
            {notice}
          </Alert>
        )}

        <FamilyPicture category={category} className="h-32 rounded-2xl" />

        <div className="space-y-2">
          <Badge tone={category.isActive ? 'success' : 'neutral'} dot>
            {category.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
          <p className="text-sm text-fg/90">{category.description ?? 'Sin descripción.'}</p>
          {!category.isActive && (
            <p className="text-xs text-muted">
              No se puede elegir para productos nuevos; los que la tienen la conservan.
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <dt className="text-xs text-muted">Productos</dt>
            <dd className="mt-1 text-lg font-bold text-fg tabular-nums">{category.productCount}</dd>
            {productsBelow > 0 && (
              <dd className="text-xs text-muted">+{productsBelow} en subfamilias</dd>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <dt className="text-xs text-muted">Subfamilias</dt>
            <dd className="mt-1 text-lg font-bold text-fg tabular-nums">{subfamilies.length}</dd>
          </div>
        </dl>
        {total > 0 && (
          <Link
            to={`/products?category=${category.id}&status=all`}
            className="inline-block text-sm font-semibold text-primary hover:underline"
          >
            Ver {total === 1 ? 'su producto' : `sus ${total} productos`}
          </Link>
        )}

        <section aria-labelledby="family-subfamilies" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 id="family-subfamilies" className="text-sm font-bold text-fg">
              Subfamilias
            </h3>
            {actions && category.isActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.onNewSubfamily(category)}
                className="gap-1 px-2 text-primary"
              >
                <FiPlus aria-hidden className="size-4" /> Nueva subfamilia
              </Button>
            )}
          </div>

          {subfamilies.length === 0 ? (
            <p className="text-sm text-muted">Esta familia no tiene subfamilias.</p>
          ) : (
            <ul className="divide-y divide-line2 rounded-xl bg-primary/10 p-3">
              {subfamilies.map(({ category: sub, depth }) => (
                <li
                  key={sub.id}
                  className="px-3 py-2.5"
                  style={depth ? { paddingLeft: `${0.75 + depth * 1.25}rem` } : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-4">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-fg">
                        {depth > 0 && (
                          <span aria-hidden className="text-muted">
                            ↳
                          </span>
                        )}
                        {sub.name}
                        {!sub.isActive && (
                          <Badge
                            tone="neutral"
                            size="sm"
                            className="border-0 bg-accent text-surface"
                          >
                            Inactiva
                          </Badge>
                        )}
                      </p>
                      {sub.description && (
                        <p className="line-clamp-2 text-xs text-muted">{sub.description}</p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted tabular-nums">
                      {count(sub.productCount, 'producto', 'productos')}
                    </p>
                  </div>
                  {actions && (
                    <div className="mt-1 -ml-2 flex flex-wrap items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => actions.onEdit(sub)}
                        className="text-xs text-muted hover:text-fg"
                        aria-label={`Editar ${sub.name}`}
                      >
                        Editar
                      </Button>
                      <StatusButton category={sub} onChangeStatus={actions.onChangeStatus} />
                      {sub.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => actions.onNewSubfamily(sub)}
                          className="gap-1 text-xs text-muted hover:text-fg"
                          aria-label={`Nueva subfamilia en ${sub.name}`}
                        >
                          <FiPlus aria-hidden className="size-3.5" /> Subfamilia
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}

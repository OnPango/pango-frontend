import { useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { MdEdit } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import type { Column } from '@/shared/types/dataTable';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { CardGrid } from '@/shared/ui/components/CardGrid';
import { DataTable } from '@/shared/ui/components/DataTable';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { ViewModeToggle } from '@/shared/ui/components/ViewModeToggle';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useCategories } from '../api/products.queries';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { CategoryStatusDialog } from '../components/CategoryStatusDialog';
import { FamilyCard, type FamilyCardProps } from '../components/FamilyCard';
import { FamilyDetailPanel } from '../components/FamilyDetailPanel';
import { categoryPaths, categoryTree, withDescendants } from '../content/catalog.labels';
import { productsErrorMessage } from '../content/products.errors';
import { useFamiliesView } from '../hooks/useFamiliesView';
import type { ProductCategory } from '../types/products.types';

type StatusFilter = 'active' | 'inactive' | 'all';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
];

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

interface FamilyRow {
  category: ProductCategory;
  /** Indentation in the tree; null: a flat list, which shows the parents in the name. */
  depth: number | null;
  path: string;
  /** Products in its subfamilies, at any depth. */
  belowCount: number;
}

/** What the form is open for: a new family (optionally under one) or the one being edited. */
type FormFor = { kind: 'new'; parentId: string | null } | { kind: 'edit'; id: string } | null;

/**
 * CU-03, US-011: the product families; rename, move, nest and (de)activate them. As a table, the
 * whole tree; as cards, the top-level families, each opening a panel with its subfamilies.
 */
export default function FamiliesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = hasAnyPermission(currentUser, ['category.manage']);
  const { data: categories = [], isLoading, error } = useCategories();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [formFor, setFormFor] = useState<FormFor>(null);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { view, setView } = useFamiliesView();
  // The panel keeps an id, not a copy: after an edit it shows the family as the list has it now.
  const [detailId, setDetailId] = useState<string | null>(null);

  const byId = (id: string | null | undefined) =>
    categories.find((category) => category.id === id) ?? null;
  const editing = formFor?.kind === 'edit' ? byId(formFor.id) : null;
  const changingStatus = byId(statusId);
  const detail = byId(detailId);

  /** Whether a family passes the status filter and has every word of the search. */
  const passes = useMemo(() => {
    const paths = categoryPaths(categories);
    const words = plain(search).split(/\s+/).filter(Boolean);
    return (category: ProductCategory) => {
      if (status === 'active' && !category.isActive) return false;
      if (status === 'inactive' && category.isActive) return false;
      const haystack = plain(`${paths.get(category.id) ?? ''} ${category.description ?? ''}`);
      return words.every((word) => haystack.includes(word));
    };
  }, [categories, search, status]);

  const rows = useMemo<FamilyRow[]>(() => {
    const paths = categoryPaths(categories);
    const countBelow = (category: ProductCategory) => {
      const below = withDescendants(categories, category.id);
      return categories
        .filter((other) => other.id !== category.id && below.has(other.id))
        .reduce((sum, other) => sum + other.productCount, 0);
    };
    // The tree reads well only when every family's parent is listed too: with every family, or the
    // active ones (an active family's parents are active). Otherwise each row names its parents.
    const asTree = !search.trim() && status !== 'inactive';
    return categoryTree(categories)
      .filter(({ category }) => passes(category))
      .map(({ category, depth }) => ({
        category,
        depth: asTree ? depth : null,
        path: paths.get(category.id) ?? category.name,
        belowCount: countBelow(category),
      }));
  }, [categories, search, status, passes]);

  // One card per top-level family. It stays when one of its subfamilies passes the filters, and
  // then says which.
  const cards = useMemo(() => {
    const list: Omit<FamilyCardProps, 'onOpen'>[] = [];
    for (const { category, depth } of categoryTree(categories)) {
      if (depth > 0) continue;
      const below = withDescendants(categories, category.id);
      const subfamilies = categories.filter(
        (other) => other.id !== category.id && below.has(other.id),
      );
      const matches = passes(category)
        ? []
        : subfamilies
            .filter(passes)
            .map((subfamily) => subfamily.name)
            .sort((a, b) => a.localeCompare(b, 'es'));
      if (!passes(category) && matches.length === 0) continue;
      list.push({
        category,
        productCount: subfamilies.reduce(
          (sum, subfamily) => sum + subfamily.productCount,
          category.productCount,
        ),
        subfamilyCount: subfamilies.length,
        matches,
      });
    }
    return list;
  }, [categories, passes]);

  const open = (next: FormFor) => {
    setNotice(null);
    setFormFor(next);
  };

  const columns: Column<FamilyRow>[] = [
    {
      key: 'name',
      skeleton: 'title',
      header: 'Familia',
      cell: ({ category, depth, path }) => (
        <div className="min-w-0" style={depth ? { paddingLeft: `${depth * 1.5}rem` } : undefined}>
          <p className="flex items-center gap-1.5 font-semibold text-fg">
            {depth ? (
              <span aria-hidden className="text-muted">
                ↳
              </span>
            ) : null}
            {depth === null ? path : category.name}
          </p>
          {category.description && (
            <p className="line-clamp-1 text-xs text-muted">{category.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Productos',
      className: 'text-right',
      cell: ({ category, belowCount }) => {
        const total = category.productCount + belowCount;
        return (
          <div className="text-sm text-fg/90 tabular-nums">
            {total > 0 ? (
              <Link
                to={`/products?category=${category.id}&status=all`}
                className="hover:text-primary hover:underline"
                aria-label={`Ver los productos de ${category.name}`}
              >
                {category.productCount}
              </Link>
            ) : (
              0
            )}
            {belowCount > 0 && <p className="text-xs text-muted">+{belowCount} en subfamilias</p>}
          </div>
        );
      },
    },
    {
      key: 'status',
      skeleton: 'badge',
      header: 'Estado',
      cell: ({ category }) => (
        <Badge tone={category.isActive ? 'success' : 'neutral'} dot>
          {category.isActive ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            skeleton: 'button' as const,
            header: <span className="sr-only">Acciones</span>,
            className: 'text-right',
            cell: ({ category }: FamilyRow) => (
              <div className="flex items-center justify-end gap-1">
                {category.isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => open({ kind: 'new', parentId: category.id })}
                    className="gap-1 text-xs text-muted hover:text-fg"
                    aria-label={`Nueva subfamilia en ${category.name}`}
                    title="Nueva subfamilia"
                  >
                    <FiPlus aria-hidden className="size-4" /> Subfamilia
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNotice(null);
                    setStatusId(category.id);
                  }}
                  className={`text-xs ${
                    category.isActive
                      ? 'text-danger hover:bg-danger/10'
                      : 'text-success hover:bg-success/10'
                  }`}
                  aria-label={
                    category.isActive ? `Desactivar ${category.name}` : `Reactivar ${category.name}`
                  }
                >
                  {category.isActive ? 'Desactivar' : 'Reactivar'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => open({ kind: 'edit', id: category.id })}
                  className="gap-2 p-1.5 text-muted hover:text-fg"
                  aria-label={`Editar ${category.name}`}
                >
                  Editar
                  <MdEdit aria-hidden className="size-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const loadError = error
    ? productsErrorMessage(error, 'No se pudieron cargar las familias.')
    : undefined;
  const emptyMessage = search.trim()
    ? 'Ninguna familia coincide con la búsqueda.'
    : status === 'inactive'
      ? 'No hay familias inactivas.'
      : canManage
        ? 'Aún no hay familias. Crea la primera: cada producto necesita una.'
        : 'Aún no hay familias.';

  const created = formFor?.kind === 'new';
  const parentOfNew = formFor?.kind === 'new' ? byId(formFor.parentId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Familias"
        subtitle="Agrupa los productos en familias y subfamilias para buscarlos y filtrarlos. Una familia inactiva ya no se elige para productos nuevos; los que la tienen la conservan."
        onAction={canManage ? () => open({ kind: 'new', parentId: null }) : undefined}
        icon={FiPlus}
        actionText="Nueva familia"
      />

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <section
        aria-label="Búsqueda y filtros"
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        <TextBox
          type="search"
          aria-label="Buscar familia"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o descripción…"
          leadingIcon={FiSearch}
          containerClassName="flex-1"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
            options={STATUS_OPTIONS}
            className="w-full sm:w-44"
          />
          <ViewModeToggle legend="Ver las familias como" value={view} onChange={setView} />
        </div>
      </section>

      {view === 'table' ? (
        <DataTable<FamilyRow>
          caption="Familias de productos"
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.category.id}
          isLoading={isLoading}
          error={loadError}
          emptyMessage={emptyMessage}
        />
      ) : (
        <CardGrid
          ariaLabel="Familias principales"
          items={cards}
          getItemKey={(card) => card.category.id}
          isLoading={isLoading}
          skeletonCount={3}
          skeletonClassName="h-72"
          error={loadError}
          emptyMessage={emptyMessage}
          renderItem={(card) => (
            <FamilyCard
              {...card}
              onOpen={(category) => {
                setNotice(null);
                setDetailId(category.id);
              }}
            />
          )}
        />
      )}

      {detail && (
        <FamilyDetailPanel
          category={detail}
          categories={categories}
          notice={notice}
          onDismissNotice={() => setNotice(null)}
          actions={
            canManage
              ? {
                  onEdit: (category) => open({ kind: 'edit', id: category.id }),
                  onNewSubfamily: (parent) => open({ kind: 'new', parentId: parent.id }),
                  onChangeStatus: (category) => {
                    setNotice(null);
                    setStatusId(category.id);
                  },
                }
              : undefined
          }
          onClose={() => setDetailId(null)}
        />
      )}

      <CategoryFormModal
        isOpen={created || editing !== null}
        category={editing}
        parentId={parentOfNew?.id ?? null}
        categories={categories}
        onClose={() => setFormFor(null)}
        onSaved={(category) => {
          const parent = byId(category.parentId);
          setNotice(
            created
              ? parent
                ? `Subfamilia «${category.name}» creada en «${parent.name}».`
                : `Familia «${category.name}» creada.`
              : `Cambios guardados en «${category.name}».`,
          );
          setFormFor(null);
        }}
      />

      {changingStatus && (
        <CategoryStatusDialog
          category={changingStatus}
          categories={categories}
          onClose={() => setStatusId(null)}
          onDone={(category) => {
            setNotice(
              category.isActive
                ? `«${category.name}» está activa otra vez.`
                : `«${category.name}» quedó inactiva.`,
            );
            setStatusId(null);
          }}
        />
      )}
    </div>
  );
}

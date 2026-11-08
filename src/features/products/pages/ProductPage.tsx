import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useCatalog, useCategories, useUnitsOfMeasure } from '../api/products.queries';
import { ProductDetailPanel } from '../components/ProductDetailPanel';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductsTable } from '../components/ProductsTable';
import { categoryPaths, toCategorySelectOptions } from '../content/catalog.labels';
import { productsErrorMessage } from '../content/products.errors';
import { filterProducts } from '../content/productSearch';
import { ALL_CATEGORIES, useProductFilters } from '../hooks/useProductFilters';
import type { Product, ProductStatusFilter } from '../types/products.types';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Archivados' },
  { value: 'all', label: 'Todos los estados' },
];

export default function ProductPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = hasAnyPermission(currentUser, ['product.manage']);
  const canManageCategories = hasAnyPermission(currentUser, ['category.manage']);
  const canReadStock = hasAnyPermission(currentUser, ['stock.read']);

  const {
    search,
    setSearch,
    categoryId,
    setCategoryId,
    status,
    setStatus,
    page,
    setPage,
    pageSize,
    setPageSize,
    filters,
    isFiltered,
  } = useProductFilters();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  // The panel keeps an id, not a copy: after an edit it shows the product as the list has it now.
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data: catalog, isLoading, isFetching, error } = useCatalog();
  const { data: categories = [] } = useCategories();

  // Filtering runs on every keystroke; deferring it keeps typing smooth on a large catalog.
  const deferredFilters = useDeferredValue(filters);
  const matches = useMemo(
    () => filterProducts(catalog ?? [], categories, deferredFilters),
    [catalog, categories, deferredFilters],
  );
  // A page past the end (fewer matches, or an old link) shows the last one instead of nothing.
  const lastPage = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(page, lastPage);
  const pageItems = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const { data: units = [] } = useUnitsOfMeasure();

  const categoryOptions = useMemo(
    () =>
      toCategorySelectOptions(categories, {
        allOption: { value: ALL_CATEGORIES, label: 'Todas las familias' },
      }),
    [categories],
  );

  const handleSaved = (product: Product) => {
    setNotice(
      editing
        ? `Cambios guardados en «${product.name}».`
        : `Producto «${product.name}» registrado.`,
    );
    setIsCreateOpen(false);
    setEditing(null);
  };

  const handleOpen = useCallback((product: Product) => setOpenId(product.id), []);
  const opened = catalog?.find((product) => product.id === openId) ?? null;
  const paths = useMemo(() => categoryPaths(categories), [categories]);

  const handleEdit = useCallback((product: Product) => {
    setNotice(null);
    setEditing(product);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        subtitle="Registra y consulta los productos que guardas. Cada uno se cuenta en su propia unidad de medida."
        onAction={
          canManage
            ? () => {
                setNotice(null);
                setIsCreateOpen(true);
              }
            : undefined
        }
        icon={FiPlus}
        actionText="Nuevo producto"
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
          aria-label="Buscar producto"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, nombre o familia…"
          leadingIcon={FiSearch}
          containerClassName="flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filtrar por familia"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            searchable
            searchPlaceholder="Buscar familia…"
            emptyMessage="Ninguna familia coincide"
            className="w-full sm:w-56"
          />
          <Select
            aria-label="Filtrar por estado"
            value={status}
            onChange={(value) => setStatus(value as ProductStatusFilter)}
            options={STATUS_OPTIONS}
            className="w-full sm:w-44"
          />
        </div>
      </section>

      <ProductsTable
        products={pageItems}
        isLoading={isLoading}
        error={
          error ? productsErrorMessage(error, 'No se pudieron cargar los productos.') : undefined
        }
        emptyMessage={
          isFiltered
            ? 'Ningún producto coincide con la búsqueda.'
            : status === 'inactive'
              ? 'No hay productos archivados.'
              : 'Aún no hay productos. Registra el primero con «Nuevo producto».'
        }
        page={currentPage}
        pageSize={pageSize}
        totalItems={matches.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onOpen={handleOpen}
        onEdit={canManage ? handleEdit : undefined}
      />
      {isFetching && !isLoading && (
        <p role="status" className="sr-only">
          Actualizando productos…
        </p>
      )}

      {opened && (
        <ProductDetailPanel
          product={opened}
          familyPath={paths.get(opened.category.id) ?? opened.category.name}
          canManage={canManage}
          canSeeStockPerWarehouse={canReadStock}
          onClose={() => setOpenId(null)}
          onEdit={handleEdit}
        />
      )}

      <ProductFormModal
        isOpen={isCreateOpen || editing !== null}
        product={editing}
        onClose={() => {
          setIsCreateOpen(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        categories={categories}
        units={units}
        canCreateCategory={canManageCategories}
      />
    </div>
  );
}

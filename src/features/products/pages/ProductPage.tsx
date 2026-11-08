import { useMemo, useState } from 'react';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useCategories, useProducts, useUnitsOfMeasure } from '../api/products.queries';
import { NewProductModal } from '../components/NewProductModal';
import { ProductsTable } from '../components/ProductsTable';
import { toCategorySelectOptions } from '../content/catalog.labels';
import { productsErrorMessage } from '../content/products.errors';
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
  const [notice, setNotice] = useState<string | null>(null);

  const { data, isLoading, isFetching, error } = useProducts(filters);
  const { data: categories = [] } = useCategories();
  const { data: units = [] } = useUnitsOfMeasure();

  const categoryOptions = useMemo(
    () =>
      toCategorySelectOptions(categories, {
        allOption: { value: ALL_CATEGORIES, label: 'Todas las familias' },
      }),
    [categories],
  );

  const handleCreated = (product: Product) => {
    setIsCreateOpen(false);
    setNotice(`Producto «${product.name}» registrado.`);
  };

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
          placeholder="Buscar por nombre o código…"
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
        products={data?.items ?? []}
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
        page={page}
        pageSize={pageSize}
        totalItems={data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      {isFetching && !isLoading && (
        <p role="status" className="sr-only">
          Actualizando productos…
        </p>
      )}

      <NewProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
        categories={categories}
        units={units}
        canCreateCategory={canManageCategories}
      />
    </div>
  );
}

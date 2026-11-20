import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { useWarehouseForecasts } from '../api/forecast.queries';
import { forecastErrorMessage } from '../content/forecast.errors';
import type {
  Option,
  WarehouseForecastRow,
  WarehouseForecastSort,
  WarehouseForecastStatus,
} from '../types/forecast.types';
import { WarehouseForecastTable } from './WarehouseForecastTable';

const ALL = 'all';

const STATUSES: { value: WarehouseForecastStatus; label: string }[] = [
  { value: 'ok', label: 'Con pronóstico' },
  { value: 'error', label: 'Con error' },
  { value: 'no_forecast', label: 'Omitidos' },
  { value: 'none', label: 'Sin pronóstico' },
];

const SORTS = [
  { value: 'name', label: 'Por nombre' },
  {
    value: 'estimate',
    label: 'Mayor demanda esperada',
    description: 'Los que más se espera que se pidan primero',
  },
];

interface WarehouseForecastViewProps {
  warehouses: Option[];
  warehouseId: string;
  onWarehouseChange: (id: string) => void;
  onOpenProduct: (productId: string) => void;
}

/** Every product of a warehouse and where its forecast stands: what to expect, and what is missing. */
export function WarehouseForecastView({
  warehouses,
  warehouseId,
  onWarehouseChange,
  onOpenProduct,
}: WarehouseForecastViewProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<WarehouseForecastStatus | null>(null);
  const [sort, setSort] = useState<WarehouseForecastSort>('name');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const debouncedSearch = useDebouncedValue(search);
  const forecasts = useWarehouseForecasts({
    warehouseId,
    search: debouncedSearch,
    status,
    sort,
    page,
    pageSize,
  });

  const filterBy = (next: WarehouseForecastStatus | null) => {
    setStatus(next);
    setPage(1);
  };
  const summary = forecasts.data?.summary;
  const rows = forecasts.data?.items ?? [];
  const horizon = rows.find((row) => row.current)?.current?.periods.length ?? null;
  const filtered = status !== null || debouncedSearch.trim() !== '';

  return (
    <section
      aria-labelledby="forecast-by-warehouse"
      className="flex min-w-0 flex-col gap-5 rounded-2xl"
    >
      <div>
        <h2 id="forecast-by-warehouse" className="text-lg font-bold text-fg">
          Pronóstico por almacén
        </h2>
        <p className="text-sm text-muted">
          Lo que se espera que se pida de cada producto en las próximas semanas, y cuáles aún no
          tienen pronóstico.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {warehouses.length > 1 && (
          <Select
            aria-label="Almacén"
            value={warehouseId}
            onChange={(value) => {
              if (!value) return;
              onWarehouseChange(value);
              setPage(1);
            }}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            searchable={warehouses.length > 8}
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
            className="w-full lg:w-60"
          />
        )}
        <TextBox
          type="search"
          aria-label="Buscar producto"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar por código o nombre…"
          leadingIcon={FiSearch}
          containerClassName="flex-1"
        />
        <Select
          aria-label="Filtrar por estado"
          value={status ?? ALL}
          onChange={(value) =>
            filterBy(!value || value === ALL ? null : (value as WarehouseForecastStatus))
          }
          options={[
            { value: ALL, label: 'Todos los estados' },
            ...STATUSES.map(({ value, label }) => ({ value, label })),
          ]}
          className="w-full lg:w-48"
        />
        <Select
          aria-label="Ordenar productos"
          value={sort}
          onChange={(value) => {
            setSort((value || 'name') as WarehouseForecastSort);
            setPage(1);
          }}
          options={SORTS}
          className="w-full lg:w-56"
        />
      </div>

      {summary && (
        <ul aria-label="Resumen del almacén" className="flex flex-wrap gap-2">
          <li>
            <SummaryChip
              label={`${summary.products} productos`}
              active={status === null}
              onClick={() => filterBy(null)}
            />
          </li>
          {STATUSES.filter(({ value }) => summary[value] > 0).map(({ value, label }) => (
            <li key={value}>
              <SummaryChip
                label={`${summary[value]} ${label.toLowerCase()}`}
                active={status === value}
                onClick={() => filterBy(status === value ? null : value)}
                warn={value === 'error'}
              />
            </li>
          ))}
        </ul>
      )}

      <WarehouseForecastTable
        rows={rows}
        horizon={horizon}
        isLoading={forecasts.isLoading || warehouseId === ''}
        isRefreshing={forecasts.isPlaceholderData}
        error={
          forecasts.error
            ? forecastErrorMessage(forecasts.error, 'No se pudo cargar el pronóstico del almacén.')
            : undefined
        }
        emptyMessage={
          filtered
            ? 'Ningún producto coincide con la búsqueda o el filtro.'
            : 'Este almacén aún no tiene productos habilitados.'
        }
        page={page}
        pageSize={pageSize}
        totalItems={forecasts.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onOpen={(row: WarehouseForecastRow) => onOpenProduct(row.product.id)}
      />
    </section>
  );
}

function SummaryChip({
  label,
  active,
  onClick,
  warn = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  warn?: boolean;
}) {
  return (
    <Button
      variant={active ? 'primary' : 'outline'}
      size="sm"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full font-medium',
        !active && warn && 'border-warning/30 bg-warning/10 text-warning hover:bg-warning/15',
      )}
    >
      {label}
    </Button>
  );
}

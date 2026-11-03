import { Badge } from '@/shared/ui/components/Badge';
import type { InventoryLevelItem, StockStatus } from '../types/dashboard.types';

interface InventoryLevelProps {
  items: InventoryLevelItem[];
}

function getStatusStyle(status: StockStatus) {
  switch (status) {
    case 'critico':
      return {
        barBg: 'bg-danger',
        textColor: 'text-danger',
        badgeTone: 'danger' as const,
        label: 'Crítico',
      };
    case 'preventivo':
      return {
        barBg: 'bg-warning',
        textColor: 'text-warning',
        badgeTone: 'warning' as const,
        label: 'Preventivo',
      };
    case 'normal':
      return {
        barBg: 'bg-success',
        textColor: 'text-success',
        badgeTone: 'success' as const,
        label: 'Normal',
      };
  }
}

export function InventoryLevel({ items }: InventoryLevelProps) {
  return (
    <div className="flex min-w-0 flex-col gap-6 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6 xl:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
            Nivel de inventario
          </h2>
          <span
            className="grid size-5 shrink-0 cursor-help place-items-center rounded-full border border-line2/60 bg-canvas text-xs font-semibold text-muted transition-colors hover:text-fg"
            title="Nivel de existencia actual comparado con el punto de reorden indicado por la marca vertical (|)"
            aria-label="Información sobre nivel de inventario"
          >
            ?
          </span>
        </div>
        <p className="text-xs text-muted sm:text-sm">Existencia frente al punto de reorden (|)</p>
      </div>

      {/* Product Progress Bars */}
      <div className="flex min-w-0 flex-col gap-5">
        {items.map((item) => {
          const maxScale =
            item.maxScale || Math.max(item.reorderPoint * 1.35, item.currentStock * 1.1, 100);
          const stockPercent = Math.min(Math.max((item.currentStock / maxScale) * 100, 0), 100);
          const reorderPercent = Math.min(Math.max((item.reorderPoint / maxScale) * 100, 0), 100);
          const style = getStatusStyle(item.status);

          return (
            <div key={item.id} className="flex min-w-0 flex-col gap-1.5">
              {/* Product row header: Name & Numbers */}
              <div className="flex items-center justify-between gap-2 text-sm font-medium">
                <span className="truncate font-semibold text-fg">{item.name}</span>
                <span className={`shrink-0 font-bold ${style.textColor}`}>
                  {item.currentStock} de {item.reorderPoint}
                </span>
              </div>

              {/* Progress Track & Reorder Tick */}
              <div className="relative flex h-3.5 w-full items-center">
                {/* Background Track */}
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-line2/40">
                  {/* Fill Bar */}
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${style.barBg}`}
                    style={{ width: `${stockPercent}%` }}
                    role="progressbar"
                    aria-valuenow={item.currentStock}
                    aria-valuemin={0}
                    aria-valuemax={item.reorderPoint}
                    aria-label={`Inventario de ${item.name}: ${item.currentStock} de ${item.reorderPoint}`}
                  />
                </div>

                {/* Vertical Reorder Tick Mark (|) */}
                <div
                  className="absolute top-1/2 z-10 h-4.5 w-[2.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg transition-all"
                  style={{ left: `${reorderPercent}%` }}
                  title={`Punto de reorden: ${item.reorderPoint}`}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend Badges */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {(['critico', 'preventivo', 'normal'] as StockStatus[]).map((status) => {
          const style = getStatusStyle(status);
          return (
            <Badge key={status} tone={style.badgeTone} dot>
              {style.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

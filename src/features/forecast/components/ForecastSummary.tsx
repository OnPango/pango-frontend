import { formatNumber, formatQuantity, type UnitRef } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import {
  DEMAND_CLASS,
  formatDay,
  formatInstant,
  reasonText,
  seriesErrorText,
} from '../content/forecast.labels';
import type { Forecast } from '../types/forecast.types';

interface ForecastSummaryProps {
  /** The newest result of the product here, whatever its status. */
  latest: Forecast | undefined;
  /** The latest successful one, which an error does not replace. */
  current: Forecast | undefined;
  unit: UnitRef;
  canRun: boolean;
}

/** What the forecast says about the coming weeks, or why there is none (US-38). */
export function ForecastSummary({ latest, current, unit, canRun }: ForecastSummaryProps) {
  if (!latest) {
    return (
      <div className="rounded-2xl border border-dashed border-line2 p-4 text-sm text-muted">
        <p className="font-semibold text-fg">Sin pronóstico todavía</p>
        <p className="mt-1">
          {canRun
            ? 'Este producto aún no se ha pronosticado en este almacén. Usa «Generar pronóstico» para hacerlo.'
            : 'Este producto aún no se ha pronosticado en este almacén.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {latest.status === 'error' && (
        <Alert tone="warning" title="El último pronóstico no se pudo hacer">
          {seriesErrorText(latest.error?.code)}
        </Alert>
      )}
      {latest.status === 'no_forecast' && (
        <Alert tone="info" title="No se pronostica aquí">
          {reasonText(latest.reason)}
        </Alert>
      )}

      {current?.total && (
        <div className="space-y-3 rounded-2xl border border-line2 p-4">
          {current !== latest && <p className="text-xs text-muted">Último pronóstico válido:</p>}
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Próximas {current.periods.length} semanas
            </p>
            <p className="mt-1 text-2xl font-bold text-fg tabular-nums">
              {formatQuantity(current.total.estimate, unit)}
            </p>
            <p className="text-sm text-muted tabular-nums">
              Probablemente entre {formatNumber(current.total.lower)} y{' '}
              {formatNumber(current.total.upper)}
            </p>
          </div>

          {current.demandClass && (
            <div className="space-y-1">
              <Badge tone="secondary" size="sm">
                Demanda {DEMAND_CLASS[current.demandClass].label.toLowerCase()}
              </Badge>
              <p className="text-xs text-muted">{DEMAND_CLASS[current.demandClass].description}</p>
            </div>
          )}

          <dl className="space-y-1 text-xs text-muted">
            <div>
              <dt className="inline">Con datos hasta el </dt>
              <dd className="inline text-fg">{formatDay(current.historyEnd)}</dd>
            </div>
            <div>
              <dt className="inline">Generado: </dt>
              <dd className="inline text-fg">{formatInstant(current.createdAt)}</dd>
            </div>
            {current.modelName && (
              <div>
                <dt className="inline">Modelo: </dt>
                <dd className="inline text-fg">{current.modelName}</dd>
              </div>
            )}
          </dl>

          {current.warnings.length > 0 && (
            <details className="text-xs text-muted">
              <summary className="cursor-pointer text-fg">
                Avisos del servicio ({current.warnings.length})
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {current.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

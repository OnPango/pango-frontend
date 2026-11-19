import { formatNumber, formatQuantity, type UnitRef } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import {
  DEMAND_CLASS,
  formatDay,
  formatInstant,
  formatInstantDay,
  formatWeek,
  reasonText,
  seriesErrorText,
} from '../content/forecast.labels';
import type { Forecast } from '../types/forecast.types';

/** A forecast against what happened in the weeks of it that have already closed. */
export interface ForecastCheck {
  weeks: number;
  actual: number;
  estimated: number;
}

interface ForecastSummaryProps {
  /** The newest result of the product here, whatever its status. */
  latest: Forecast | undefined;
  /** The latest successful one, which an error does not replace. */
  current: Forecast | undefined;
  /** The one on the chart: the current one, or an earlier one chosen to look back. */
  shown: Forecast | undefined;
  check: ForecastCheck | null;
  unit: UnitRef;
  canRun: boolean;
}

/** What the forecast says about its weeks, or why there is none (US-38, CU-10 A2). */
export function ForecastSummary({
  latest,
  current,
  shown,
  check,
  unit,
  canRun,
}: ForecastSummaryProps) {
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

  const isPast = shown !== undefined && shown !== current;

  return (
    <div className="space-y-4">
      {!isPast && latest.status === 'error' && (
        <Alert tone="warning" title="El último pronóstico no se pudo hacer">
          {seriesErrorText(latest.error?.code)}
        </Alert>
      )}
      {!isPast && latest.status === 'no_forecast' && (
        <Alert tone="info" title="No se pronostica aquí">
          {reasonText(latest.reason)}
        </Alert>
      )}

      {shown?.total && (
        <div className="space-y-3 rounded-2xl border border-line2 p-4">
          {isPast ? (
            <p className="text-xs text-muted">
              Pronóstico anterior, del {formatInstantDay(shown.createdAt)}:
            </p>
          ) : (
            shown !== latest && <p className="text-xs text-muted">Último pronóstico válido:</p>
          )}
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {isPast
                ? `${shown.periods.length} semanas desde el ${formatWeek(shown.periods[0]?.start ?? shown.historyEnd)}`
                : `Próximas ${shown.periods.length} semanas`}
            </p>
            <p className="mt-1 text-2xl font-bold text-fg tabular-nums">
              {formatQuantity(shown.total.estimate, unit)}
            </p>
            <p className="text-sm text-muted tabular-nums">
              Probablemente entre {formatNumber(shown.total.lower)} y{' '}
              {formatNumber(shown.total.upper)}
            </p>
          </div>

          {check && (
            <div className="rounded-xl bg-fg/5 px-3 py-2 text-xs text-muted">
              <p>
                En{' '}
                {check.weeks === 1
                  ? 'la semana ya cerrada'
                  : `las ${check.weeks} semanas ya cerradas`}{' '}
                se pidieron{' '}
                <span className="font-semibold text-fg tabular-nums">
                  {formatQuantity(check.actual, unit)}
                </span>
                ; se esperaban{' '}
                <span className="font-semibold text-fg tabular-nums">
                  {formatNumber(check.estimated)}
                </span>
                .
              </p>
            </div>
          )}

          {shown.demandClass && (
            <div className="space-y-1">
              <Badge tone="secondary" size="sm">
                Demanda {DEMAND_CLASS[shown.demandClass].label.toLowerCase()}
              </Badge>
              <p className="text-xs text-muted">{DEMAND_CLASS[shown.demandClass].description}</p>
            </div>
          )}

          <dl className="space-y-1 text-xs text-muted">
            <div>
              <dt className="inline">Con datos hasta el </dt>
              <dd className="inline text-fg">{formatDay(shown.historyEnd)}</dd>
            </div>
            <div>
              <dt className="inline">Generado: </dt>
              <dd className="inline text-fg">
                {formatInstant(shown.createdAt)} · ejecución #{shown.runId}
              </dd>
            </div>
            {shown.modelName && (
              <div>
                <dt className="inline">Modelo: </dt>
                <dd className="inline text-fg">{shown.modelName}</dd>
              </div>
            )}
          </dl>

          {shown.warnings.length > 0 && (
            <details className="text-xs text-muted">
              <summary className="cursor-pointer text-fg">
                Avisos del servicio ({shown.warnings.length})
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {shown.warnings.map((warning) => (
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

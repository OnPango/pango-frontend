import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { ImportAnalysis } from '../types/imports.types';
import { StepFrame } from './StepFrame';

export interface MappingStepProps {
  analysis: ImportAnalysis;
  mapping: Record<string, string | null>;
  missing: { key: string; label: string }[];
  isLoading: boolean;
  error: string | null;
  onColumn: (key: string, column: string) => void;
  onBack: () => void;
  onNext: () => void;
}

/** Step 2: which column of the file carries each datum Pango needs. */
export function MappingStep({
  analysis,
  mapping,
  missing,
  isLoading,
  error,
  onColumn,
  onBack,
  onNext,
}: MappingStepProps) {
  const [showOptional, setShowOptional] = useState(false);
  const allJoined = analysis.file.isTemplate;

  return (
    <StepFrame
      title="2 · Une las columnas"
      onBack={onBack}
      onNext={onNext}
      nextDisabled={missing.length > 0}
      nextLoading={isLoading}
      error={error}
    >
      <p className="text-sm text-muted">
        Tu archivo puede llamar distinto a cada dato. Aquí le dices a Pango cuál columna es cuál.
      </p>

      {missing.length > 0 ? (
        <Alert tone="warning" title={`Falta unir ${missing.length} dato obligatorio:`}>
          {missing.map((field) => field.label.toLowerCase()).join(', ')}. Elige cuál columna de tu
          archivo trae el dato.
        </Alert>
      ) : (
        <Alert tone="success">
          {allJoined
            ? 'Como usaste la plantilla, Pango unió todas las columnas solo. Revisa y continúa.'
            : 'Todas las columnas obligatorias están unidas. Revisa y continúa.'}
        </Alert>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line2">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">Columnas de tu archivo y el dato de Pango que traen</caption>
          <thead className="bg-fg/5 text-xs text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-2.5">
                Dato que necesita Pango
              </th>
              <th scope="col" className="px-4 py-2.5">
                Columna de tu archivo
              </th>
              <th scope="col" className="px-4 py-2.5">
                Ejemplo
              </th>
              <th scope="col" className="px-4 py-2.5">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {analysis.fields.map((field) => {
              const column = mapping[field.key] ?? '';
              const pending = field.required && !column;
              return (
                <tr key={field.key} className="border-t border-line2 align-middle">
                  <th scope="row" className="px-4 py-3 font-semibold text-fg">
                    {field.label}
                    {field.hint && (
                      <span className="block text-xs font-normal text-muted">({field.hint})</span>
                    )}
                  </th>
                  <td className="px-4 py-3">
                    <Select
                      aria-label={`Columna para ${field.label}`}
                      value={column}
                      onChange={(value) => onColumn(field.key, value)}
                      placeholder="Elige una columna…"
                      options={analysis.headers.map((header) => ({ value: header, label: header }))}
                      clearable={!field.required}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-muted">{column ? field.example : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={pending ? 'warning' : column ? 'success' : 'neutral'} size="sm">
                      {pending ? 'Falta unir' : column ? 'Listo' : 'Sin unir'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {analysis.optionalCount > 0 && analysis.optionalSummary && (
        <div>
          <button
            type="button"
            aria-expanded={showOptional}
            onClick={() => setShowOptional((open) => !open)}
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <FiChevronDown
              aria-hidden
              className={showOptional ? 'rotate-180 transition' : 'transition'}
            />
            Ver los {analysis.optionalCount} datos opcionales (todos unidos)
          </button>
          {showOptional && <p className="mt-2 text-sm text-muted">{analysis.optionalSummary}</p>}
        </div>
      )}
    </StepFrame>
  );
}

import { useSearchParams } from 'react-router-dom';
import { env } from '@/core/config/env';
import { importsErrorMessage } from '../content/imports.errors';
import { useImports } from '../api/imports.queries';
import { Alert } from '@/shared/ui/components/Alert';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { ImportHistory } from '../components/ImportHistory';
import { InventoryImportWizard } from '../components/inventory/InventoryImportWizard';
import { KindCard } from '../components/KindCard';
import { MovementImportWizard } from '../components/movements/MovementImportWizard';
import {
  hasInventoryImportInProgress,
  useInventoryImportStore,
} from '../hooks/inventoryImport.store';
import { hasImportInProgress, useMovementImportStore } from '../hooks/movementImport.store';
import { useImportOwner } from '../hooks/useMovementImportWizard';
import { QualityView } from '../components/QualityView';
import { IMPORT_KINDS, type ImportKind } from '../types/imports.types';

const isKind = (value: string | null): value is ImportKind =>
  IMPORT_KINDS.includes(value as ImportKind);

/**
 * The list of past loads and the history quality still answer only from the mock backend
 * (`src/mocks/handlers/imports.handlers.ts`), so against the real API they are hidden. Both imports
 * run against pango-core (`/inventory-imports`, `/movement-imports`).
 */
const MOCK_ONLY_AVAILABLE = env.useMock;

/**
 * Importar datos: choose what to load (inventory or movements), walk the five steps of the load,
 * and see the quality of the movement history. What is on screen lives in the URL
 * (`?import=inventory`, `?view=quality`), so the browser's back button leaves a step the way a
 * person expects, and the assistant can link straight to a load.
 */
export default function ImportDataPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const kindParam = searchParams.get('import');
  const requested = isKind(kindParam) ? kindParam : null;
  const user = useAuthStore((state) => state.user);
  const canImport = {
    inventory: hasAnyPermission(user, ['inventory.import']),
    movements: hasAnyPermission(user, ['movement.import']),
  };
  const kind = requested && canImport[requested] ? requested : null;
  const quality = MOCK_ONLY_AVAILABLE && searchParams.get('view') === 'quality';
  const { data: records = [], isLoading, error } = useImports(MOCK_ONLY_AVAILABLE);
  // An import left halfway is where Importar datos opens: it kept running meanwhile.
  const owner = useImportOwner();
  const resumesMovements = useMovementImportStore(
    (state) => state.owner === owner && hasImportInProgress(state),
  );
  const resumesInventory = useInventoryImportStore(
    (state) => state.owner === owner && hasInventoryImportInProgress(state),
  );

  const go = (params: Record<string, string>) => setSearchParams(new URLSearchParams(params));
  const home = () => setSearchParams(new URLSearchParams());
  const landing = !kind && !quality;

  if (kind === 'inventory' || (landing && resumesInventory && canImport.inventory)) {
    return <InventoryImportWizard key="inventory" onExit={home} />;
  }

  if (kind === 'movements' || (landing && resumesMovements && canImport.movements)) {
    return <MovementImportWizard key="movements" onExit={home} />;
  }

  if (quality) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Calidad del historial"
          subtitle="Qué tan confiable será el pronóstico de cada producto."
        />
        <button
          type="button"
          onClick={home}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Volver a Importar datos
        </button>
        <QualityView onNewLoad={() => go({ import: 'movements' })} />
      </div>
    );
  }

  const empty = MOCK_ONLY_AVAILABLE && !isLoading && !error && records.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Importar datos"
        subtitle="Elige qué quieres cargar. El inventario fija lo que tienes hoy; los movimientos le enseñan a Pango cómo se consume."
      />

      {empty && (
        <Alert tone="info" title="Todavía no has cargado datos.">
          Te recomendamos empezar por tu inventario y luego subir tus movimientos pasados. Con el
          inventario, Pango sabe cuánto tienes hoy. Con los movimientos, aprende cuánto sale cada
          mes. Las dos cosas juntas permiten avisarte a tiempo cuándo pedir.
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <KindCard
          kind="inventory"
          badge={canImport.inventory ? (empty ? 'Paso 1 recomendado' : undefined) : 'Sin permiso'}
          disabled={!canImport.inventory}
          onStart={() => {
            // A finished import seen before is not shown again: this is a new one.
            if (useInventoryImportStore.getState().step === 'result') {
              useInventoryImportStore.getState().restart();
            }
            go({ import: 'inventory' });
          }}
        />
        <KindCard
          kind="movements"
          badge={canImport.movements ? (empty ? 'Paso 2' : undefined) : 'Sin permiso'}
          disabled={!canImport.movements}
          onStart={() => {
            // A finished import seen before is not shown again: this is a new one.
            if (useMovementImportStore.getState().step === 'result') {
              useMovementImportStore.getState().restart();
            }
            go({ import: 'movements' });
          }}
        />
      </div>

      {MOCK_ONLY_AVAILABLE && !empty && (
        <>
          <ImportHistory
            records={records}
            isLoading={isLoading}
            error={
              error
                ? importsErrorMessage(error, 'No pudimos cargar las cargas anteriores.')
                : undefined
            }
          />
          <p className="text-sm text-muted">
            Para ver qué tan completo está tu historial de movimientos, entra a{' '}
            <button
              type="button"
              onClick={() => go({ view: 'quality' })}
              className="font-semibold text-primary underline"
            >
              calidad del historial
            </button>
            .
          </p>
        </>
      )}
    </div>
  );
}

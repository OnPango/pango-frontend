import { Suspense } from 'react';

export type LazyPage = React.LazyExoticComponent<React.ComponentType>;

export const page = ({ Page, fallback }: { Page: LazyPage; fallback?: React.ReactNode }) => (
  <Suspense
    fallback={
      fallback ?? (
        <div className="flex h-full w-full items-center justify-center p-6 text-sm text-muted">
          Cargando…
        </div>
      )
    }
  >
    <Page />
  </Suspense>
);

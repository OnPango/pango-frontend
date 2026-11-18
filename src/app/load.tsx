import { Suspense } from 'react';
import { BootStep } from '@/shared/boot/BootStep';
import { PangolinLoader } from '@/shared/ui/components/PangolinLoader';

export type LazyPage = React.LazyExoticComponent<React.ComponentType>;

/**
 * While a screen's code downloads. The first screen of the app is a step of the boot screen; after
 * the start it is a small loader in the screen's place.
 */
const codeFallback = (
  <BootStep
    id="code"
    message="Ingresando a Pango"
    fallback={
      <div className="flex h-full w-full items-center justify-center p-6">
        <PangolinLoader message="Pango está abriendo la página" />
      </div>
    }
  />
);

export const page = ({ Page, fallback }: { Page: LazyPage; fallback?: React.ReactNode }) => (
  <Suspense fallback={fallback ?? codeFallback}>
    <Page />
  </Suspense>
);

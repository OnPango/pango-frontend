import { LoadingBackdrop } from '@/shared/ui/components/LoadingBackdrop';
import { PangolinLoader } from '@/shared/ui/components/PangolinLoader';

/** Full-screen loader shown while the session is being restored on app load. */
export function SessionCheck() {
  return (
    <div className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-canvas px-4">
      <LoadingBackdrop />
      <PangolinLoader
        size="screen"
        className="relative"
        message="Pango está verificando tu sesión"
        slowMessage="La conexión está tardando más de lo normal. Ya casi…"
      />
    </div>
  );
}

import { BootStep } from '@/shared/boot/BootStep';
import { PangoBackdrop } from '@/shared/ui/components/PangoBackdrop';
import { PangolinLoader } from '@/shared/ui/components/PangolinLoader';

const MESSAGE = 'Pango está verificando tu sesión';

/**
 * Shown while the session is being restored. That happens on app load, so it is a step of the boot
 * screen; the full screen of its own is only for a check after the start.
 */
export function SessionCheck() {
  return (
    <BootStep
      id="session"
      message={MESSAGE}
      fallback={
        <div className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-canvas px-4">
          <PangoBackdrop />
          <PangolinLoader
            size="screen"
            className="relative"
            message={MESSAGE}
            slowMessage="La conexión está tardando más de lo normal. Ya casi…"
          />
        </div>
      }
    />
  );
}

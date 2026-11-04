import { FiArrowRight, FiMail } from 'react-icons/fi';
import type { SignupResult } from '@/core/auth/auth.types';
import { WORKSPACE_DOMAIN } from '@/core/tenant/tenant';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';

interface RegisterSuccessProps {
  result: SignupResult;
  onContinue: () => void;
  /** Sends the confirmation email again (only offered while the email is pending). */
  onResend: () => void;
  isResending: boolean;
  /** Seconds before the email can be requested again. */
  resendCooldown: number;
  resendFailed: boolean;
}

/** Final state: the check draws itself and a ring pulses once. */
export function RegisterSuccess({
  result,
  onContinue,
  onResend,
  isResending,
  resendCooldown,
  resendFailed,
}: RegisterSuccessProps) {
  const address = `${result.subdomain}.${WORKSPACE_DOMAIN}`;
  const pending = result.kind === 'verification';

  return (
    <div role="status" className="flex flex-col items-start gap-5">
      <span className="relative grid size-16 place-items-center rounded-full bg-success/15 text-success">
        <span aria-hidden className="absolute inset-0 animate-ring rounded-full bg-success/30" />
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="relative size-9 animate-pop-in fill-none stroke-current"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path
            d="m8 12.5 2.8 2.8L16 10"
            pathLength="1"
            strokeDasharray="1"
            className="animate-draw"
          />
        </svg>
      </span>

      <div className="animate-fade-up space-y-3 [animation-delay:150ms]">
        <h1 className="text-3xl leading-tight font-bold">
          {pending ? 'Cuenta registrada' : 'Organización creada'}
        </h1>
        {pending ? (
          <p className="leading-relaxed text-muted">
            Enviamos un correo a <b className="text-fg">{result.email}</b>. Confírmalo para activar
            tu espacio <b className="text-fg">{address}</b>.
          </p>
        ) : (
          <p className="leading-relaxed text-muted">
            Tu espacio <b className="text-fg">{address}</b> está listo. Inicia sesión con la
            contraseña de tu cuenta de siempre.
          </p>
        )}
      </div>

      {pending && !result.emailSent && (
        <Alert tone="warning" className="w-full animate-fade-up">
          No pudimos enviar el correo de confirmación. Pídelo de nuevo con el botón de abajo.
        </Alert>
      )}
      {resendFailed && (
        <Alert tone="danger" className="w-full animate-fade-up">
          No se pudo reenviar el correo. Intenta de nuevo en un momento.
        </Alert>
      )}

      <div className="flex w-full animate-fade-up flex-col gap-3 [animation-delay:300ms]">
        <Button size="lg" className="group w-full gap-2.5" onClick={onContinue}>
          Ir a iniciar sesión
          <FiArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
        </Button>
        {pending && (
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2"
            onClick={onResend}
            isLoading={isResending}
            disabled={resendCooldown > 0}
          >
            <FiMail aria-hidden />
            {resendCooldown > 0 ? `Reenviar correo (${resendCooldown} s)` : 'Reenviar correo'}
          </Button>
        )}
      </div>
    </div>
  );
}

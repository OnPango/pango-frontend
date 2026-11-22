import { useRef } from 'react';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { RiShieldCheckFill } from 'react-icons/ri';
import { useShake } from '@/shared/hooks/useShake';
import { cn } from '@/shared/lib/cn';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Checkbox } from '@/shared/ui/components/form/Checkbox';
import { CodeInput, type CodeInputHandle } from '@/shared/ui/components/form/CodeInput';
import { useLoginCode, type LoginCodeOptions } from '../hooks/useLoginCode';
import { AuthCard } from './AuthPageShell';

const CODE_HINT_ID = 'login-code-hint';
const REMEMBER_HINT_ID = 'login-remember-hint';

/** `0:42` */
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const days = (n: number) => (n === 1 ? '1 día' : `${n} días`);
const hours = (n: number) => (n === 1 ? '1 hora' : `${n} horas`);

function expiryText(seconds: number) {
  if (seconds > 60) return `El código vence en ${Math.ceil(seconds / 60)} minutos.`;
  return `El código vence en ${seconds} s.`;
}

/** An envelope with Pango's shield on it: the code is in the inbox. */
function InboxBadge() {
  return (
    <span aria-hidden className="relative grid size-12 shrink-0 place-items-center sm:size-16">
      <span className="absolute inset-0 animate-ring rounded-full bg-primary/25" />
      <span className="relative grid size-12 animate-pop-in place-items-center rounded-full bg-primary/12 text-primary sm:size-16">
        <FiMail className="size-6 sm:size-7" strokeWidth={1.75} />
      </span>
      <span className="absolute -right-1 -bottom-1 grid size-7 animate-pop-in place-items-center rounded-full bg-surface text-primary shadow-sm [animation-delay:250ms]">
        <RiShieldCheckFill className="size-5" />
      </span>
    </span>
  );
}

interface LoginCodeStepProps extends LoginCodeOptions {
  /** Back to the password, dropping this login. */
  onBack: () => void;
}

/** Second step of the login: the code emailed after the password. */
export function LoginCodeStep({ onBack, ...options }: LoginCodeStepProps) {
  const { challenge } = options;
  const input = useRef<CodeInputHandle>(null);
  const code = useLoginCode(options, input);
  const boxes = useRef<HTMLDivElement>(null);
  useShake(boxes, code.rejections);

  const hint = code.error ?? (code.expired ? 'Este código venció. Pide uno nuevo.' : null);

  return (
    <AuthCard
      eyebrow="VERIFICACIÓN EN DOS PASOS"
      title={
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2>Pango no duda que seas tú…</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              …pero, por si acaso, te enviamos un código de {challenge.codeLength} dígitos a{' '}
              <b className="font-semibold text-fg">{challenge.email}</b>.
            </p>
          </div>
          <InboxBadge />
        </div>
      }
    >
      <form
        noValidate
        className="space-y-5 sm:space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          code.submit();
        }}
      >
        {!challenge.emailSent && (
          <Alert tone="warning">
            No pudimos enviar el correo con el código. Pide otro con el botón de abajo.
          </Alert>
        )}

        <div className="space-y-3">
          {/* Before the boxes: a complete code is sent at once, so the choice comes first. */}
          <div>
            <Checkbox
              label={`Recordar este dispositivo por ${days(challenge.rememberDeviceDays)}`}
              checked={code.rememberDevice}
              onChange={(event) => code.setRememberDevice(event.target.checked)}
              disabled={code.isVerifying}
              aria-describedby={REMEMBER_HINT_ID}
            />
            {/* Room is short on a phone, and phones are rarely shared. */}
            <p id={REMEMBER_HINT_ID} className="mt-0.5 hidden pl-7 text-xs text-muted sm:block">
              {challenge.trustedDeviceHours > 0
                ? `Si no, te lo pediremos de nuevo en ${hours(challenge.trustedDeviceHours)}. `
                : 'Si no, te lo pediremos cada vez. '}
              No lo marques en un computador compartido.
            </p>
          </div>
          <div ref={boxes}>
            <CodeInput
              ref={input}
              label="Código de verificación"
              value={code.digits}
              onChange={code.setDigits}
              onComplete={(value) => code.submit(value)}
              invalid={code.showRejected}
              disabled={code.isVerifying}
              aria-describedby={CODE_HINT_ID}
            />
          </div>
          <p
            id={CODE_HINT_ID}
            aria-live="polite"
            className={cn(
              'min-h-5 text-center text-sm',
              hint ? 'text-danger' : 'text-muted',
              code.expired && !code.error && 'text-warning',
            )}
          >
            {hint ??
              (code.resend.sent
                ? `Te enviamos un código nuevo. ${expiryText(code.expiresIn)}`
                : expiryText(code.expiresIn))}
          </p>
        </div>

        <section className="space-y-3 sm:space-y-4">
          <Button
            type="submit"
            variant="primary"
            className="w-full rounded-2xl p-2.5 py-3 sm:py-3.5"
            isLoading={code.isVerifying}
            disabled={!code.canSubmit}
          >
            {code.isVerifying ? 'Verificando…' : 'Verificar y entrar'}
          </Button>

          <p className="text-center text-sm text-muted">
            ¿No te llegó? Revisa la carpeta de spam o{' '}
            {code.resend.availableIn > 0 ? (
              <span className="tabular-nums">
                pide otro en{' '}
                <b className="font-semibold text-fg">{clock(code.resend.availableIn)}</b>
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={code.resend.send}
                isLoading={code.resend.isPending}
                className="h-auto p-0 align-baseline text-sm font-semibold text-primary hover:bg-transparent hover:underline"
              >
                pide otro código
              </Button>
            )}
          </p>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2 text-muted hover:text-fg"
            >
              <FiArrowLeft aria-hidden /> Volver a iniciar sesión
            </Button>
          </div>
        </section>
      </form>
    </AuthCard>
  );
}

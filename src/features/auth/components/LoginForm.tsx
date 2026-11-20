import { FaUserLarge } from 'react-icons/fa6';
import { RiLockPasswordFill } from 'react-icons/ri';
import { buildMainUrl } from '@/core/tenant/tenant';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { useLoginForm } from '../hooks/useLoginForm';
import { AuthCard } from './AuthPageShell';
import { LoginCodeStep } from './LoginCodeStep';

/** Login card of one organization (the page is served from its subdomain). */
export function LoginForm({
  tenant,
  organizationName,
}: {
  tenant: string;
  /** From `GET /organizations/current`, when it answered. */
  organizationName?: string;
}) {
  const {
    form,
    submit,
    codeStep,
    notice,
    isSubmitting,
    serverError,
    needsEmailConfirmation,
    workspaceNotFound,
    justVerified,
    resend,
  } = useLoginForm(tenant);
  const {
    register,
    formState: { errors },
  } = form;

  if (codeStep) return <LoginCodeStep {...codeStep} />;

  return (
    <AuthCard
      eyebrow="BIENVENIDO A PANGO"
      title={
        organizationName ? (
          <div className="-space-y-1">
            <h2>Iniciar sesión en</h2>
            <h2>{organizationName}</h2>
          </div>
        ) : (
          <div className="-space-y-1">
            <h2>Iniciar sesión para</h2>
            <h2>continuar</h2>
          </div>
        )
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4 sm:space-y-5">
        {justVerified && <Alert tone="success">Correo confirmado. Ya puedes iniciar sesión.</Alert>}
        {notice && <Alert tone="warning">{notice}</Alert>}

        <section className="flex flex-col gap-3">
          <TextBox
            type="email"
            autoComplete="username"
            aria-label="Email"
            placeholder="Email"
            leadingIcon={FaUserLarge}
            required
            shape="xl2"
            error={errors.email?.message}
            {...register('email')}
            className="h-12 sm:h-14"
          />
          <TextBox
            type="password"
            autoComplete="current-password"
            aria-label="Contraseña"
            placeholder="Contraseña"
            leadingIcon={RiLockPasswordFill}
            required
            shape="xl2"
            error={errors.password?.message}
            {...register('password')}
            className="h-12 sm:h-14"
          />

          {serverError && <Alert tone="danger">{serverError}</Alert>}
          {needsEmailConfirmation && (
            <div className="text-sm">
              {resend.isSuccess ? (
                <p className="text-success">Te enviamos un nuevo enlace. Revisa tu correo.</p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={resend.isPending}
                  onClick={resend.send}
                  className="text-primary"
                >
                  {resend.isPending ? 'Enviando…' : 'Reenviar correo de confirmación'}
                </Button>
              )}
              {resend.isError && (
                <p className="mt-1 text-danger">No se pudo reenviar el correo. Intenta de nuevo.</p>
              )}
            </div>
          )}
          {workspaceNotFound && (
            <a href={buildMainUrl('/login')} className="text-sm font-semibold text-primary">
              Buscar otro espacio
            </a>
          )}
        </section>

        <section className="space-y-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full gap-3 rounded-2xl p-2.5 py-3 sm:py-3.5"
            isLoading={isSubmitting}
          >
            Iniciar sesión
          </Button>
          <div className="flex items-center justify-center gap-2 text-muted">
            <div className="h-px w-full bg-canvas"></div>o
            <div className="h-px w-full bg-canvas"></div>
          </div>
          <p className="text-center text-sm text-muted">
            ¿Aún no tienes cuenta?{' '}
            <a href={buildMainUrl('/register')} className="text-primary">
              Crear una
            </a>
          </p>
        </section>
      </form>
    </AuthCard>
  );
}

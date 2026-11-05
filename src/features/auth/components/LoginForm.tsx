import { FaUserLarge } from 'react-icons/fa6';
import { RiLockPasswordFill } from 'react-icons/ri';
import { buildMainUrl } from '@/core/tenant/tenant';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { useLoginForm } from '../hooks/useLoginForm';
import { AuthCard } from './AuthPageShell';

/** Login card of one organization (the page is served from its subdomain). */
export function LoginForm({ tenant }: { tenant: string }) {
  const {
    form,
    submit,
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

  return (
    <AuthCard
      eyebrow="BIENVENIDO A PANGO"
      title={
        <div className="-space-y-1">
          <h2>Iniciar sesión para</h2>
          <h2>continuar</h2>
        </div>
      }
      className="px-10 sm:px-10"
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {justVerified && <Alert tone="success">Correo confirmado. Ya puedes iniciar sesión.</Alert>}

        <section className="flex flex-col gap-3">
          <TextBox
            type="email"
            autoComplete="username"
            aria-label="Email"
            placeholder="Email"
            leadingIcon={FaUserLarge}
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <TextBox
            type="password"
            autoComplete="current-password"
            aria-label="Contraseña"
            placeholder="Contraseña"
            leadingIcon={RiLockPasswordFill}
            required
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && <Alert tone="danger">{serverError}</Alert>}
          {needsEmailConfirmation && (
            <div className="text-sm">
              {resend.isSuccess ? (
                <p className="text-success">Te enviamos un nuevo enlace. Revisa tu correo.</p>
              ) : (
                <button
                  type="button"
                  disabled={resend.isPending}
                  onClick={resend.send}
                  className="cursor-pointer font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {resend.isPending ? 'Enviando…' : 'Reenviar correo de confirmación'}
                </button>
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
          <Button type="submit" variant="primary" className="w-full p-2.5" isLoading={isSubmitting}>
            Iniciar sesión
          </Button>
          <div className="flex items-center justify-center gap-2 text-muted">
            <div className="h-px w-full bg-canvas"></div>o
            <div className="h-px w-full bg-canvas"></div>
          </div>
          <Button type="button" variant="outline" className="w-full p-2.5">
            Acceso con SSO
          </Button>
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

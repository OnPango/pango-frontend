import { useState, type FormEvent } from 'react';
import { FaUserLarge } from 'react-icons/fa6';
import { RiLockPasswordFill } from 'react-icons/ri';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { getApiErrorCode } from '@/core/api';
import type { LoginRedirectState } from '@/core/auth/guards';
import { buildMainUrl, getCurrentTenant } from '@/core/tenant/tenant';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { useLogin } from '../api/useLogin';
import { useResendVerification } from '../api/useVerifyEmail';
import { AuthCard, AuthPageShell } from '../components/AuthPageShell';
import { FindWorkspaceForm } from '../components/FindWorkspaceForm';
import { getAuthErrorMessage } from '../lib/auth.errors';

export default function LoginPage() {
  const tenant = getCurrentTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const loginMutation = useLogin();
  const resend = useResendVerification();
  const state = location.state as LoginRedirectState | null;

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');

  const redirectTo = state?.from ?? '/';
  const errorCode = getApiErrorCode(loginMutation.error);
  const error = loginMutation.isError
    ? getAuthErrorMessage(loginMutation.error, 'No se pudo iniciar sesión.')
    : null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resend.reset();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  };

  if (!tenant) {
    return (
      <AuthPageShell>
        <AuthCard
          eyebrow="BIENVENIDO A PANGO"
          title={
            <>
              <h2>Encuentra tu espacio</h2>
              <p className="mt-2 text-sm text-muted">
                Cada empresa tiene su propia dirección. Escríbela para iniciar sesión.
              </p>
            </>
          }
          className="sm:w-120"
        >
          <FindWorkspaceForm />
          <p className="text-center text-sm text-muted">
            ¿Aún no tienes cuenta?{' '}
            <a href={buildMainUrl('/register')} className="text-primary">
              Crear una
            </a>
          </p>
        </AuthCard>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-5 rounded-4xl border border-line2 bg-surface px-10 py-8 shadow-lg"
      >
        <h4 className="text-md m-0 font-light tracking-wide">BIENVENIDO A PANGO</h4>
        <div className="w-9 border-3 border-b border-primary" />

        <section className="-space-y-1 text-xl">
          <h2>Iniciar sesión para</h2>
          <h2>continuar</h2>
        </section>

        {searchParams.get('verified') === '1' && (
          <Alert tone="success">Correo confirmado. Ya puedes iniciar sesión.</Alert>
        )}

        <section className="flex flex-col gap-3">
          <TextBox
            name="email"
            type="email"
            autoComplete="username"
            aria-label="Email"
            placeholder="Email"
            leadingIcon={FaUserLarge}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextBox
            name="password"
            type="password"
            autoComplete="current-password"
            aria-label="Contraseña"
            placeholder="Contraseña"
            leadingIcon={RiLockPasswordFill}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <Alert tone="danger">{error}</Alert>}
          {errorCode === 'EMAIL_NOT_VERIFIED' && (
            <div className="text-sm">
              {resend.isSuccess ? (
                <p className="text-success">Te enviamos un nuevo enlace. Revisa tu correo.</p>
              ) : (
                <button
                  type="button"
                  disabled={resend.isPending}
                  onClick={() => resend.mutate({ email, subdomain: tenant })}
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
          {errorCode === 'ORGANIZATION_NOT_FOUND' && (
            <a href={buildMainUrl('/login')} className="text-sm font-semibold text-primary">
              Buscar otro espacio
            </a>
          )}
        </section>
        <section className="space-y-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full p-2.5"
            isLoading={loginMutation.isPending}
          >
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
    </AuthPageShell>
  );
}

import { useState, type FormEvent } from 'react';
import { FaUserLarge } from 'react-icons/fa6';
import { RiLockPasswordFill } from 'react-icons/ri';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '@/core/api';
import type { LoginRedirectState } from '@/core/auth/guards';
import { Logo } from '@/shared/ui/Logo';
import { Alert } from '@/shared/ui/components/Alert';
import { Checkbox } from '@/shared/ui/components/form/Checkbox';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Button } from '@/shared/ui/components/Button';
import { useLogin } from '../api/useLogin';
import { AuthBackdrop } from '../components/AuthBackdrop';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const state = location.state as LoginRedirectState | null;
  const [email, setEmail] = useState(state?.registeredEmail ?? '');
  const [password, setPassword] = useState('');

  const redirectTo = state?.from ?? '/';
  const error = loginMutation.isError
    ? getApiErrorMessage(loginMutation.error, 'No se pudo iniciar sesión.')
    : null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    );
  };

  return (
    <div className="grid h-screen w-full items-center justify-center">
      <AuthBackdrop />

      <main className="z-50 flex max-w-screen min-w-80 flex-col items-center justify-center gap-10 overflow-hidden p-5">
        <section className="flex items-center justify-center gap-5 xl:hidden xl:items-start xl:justify-start">
          <div className="flex flex-col gap-1 text-center xl:text-start">
            <div className="flex items-center gap-5">
              <div className="xl:hidden">
                <Logo width="50" height="50" />
              </div>
              <h2 className="text-5xl font-bold tracking-wider">PANGO</h2>
            </div>
            <p className="text-muted">Más control, mejores decisiones</p>
          </div>
        </section>
        <form
          onSubmit={handleSubmit}
          className="w-full space-y-5 rounded-4xl border border-line2 bg-surface px-12 py-8 shadow-lg"
        >
          <h4 className="text-md m-0 font-light tracking-wide">BIENVENIDO A PANGO</h4>
          <div className="w-9 border-3 border-b border-primary" />

          <section className="-space-y-1 text-xl">
            <h2>Iniciar sesión para</h2>
            <h2>continuar</h2>
          </section>

          {state?.registeredEmail && (
            <p
              role="status"
              className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm text-success"
            >
              Organización registrada. Inicia sesión con tu correo para continuar.
            </p>
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
            <div className="flex items-center justify-between">
              <Checkbox label="Recordarme" />
              <a href="/" className="text-end text-xs text-primary">
                Olvidé mi contraseña
              </a>
            </div>
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
              <Link to="/register" className="text-primary">
                Crear una
              </Link>
            </p>
          </section>
        </form>
      </main>
    </div>
  );
}

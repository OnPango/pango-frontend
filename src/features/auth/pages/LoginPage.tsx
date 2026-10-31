import { useState, type FormEvent } from 'react';
import { FaUserLarge } from 'react-icons/fa6';
import { RiLockPasswordFill } from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '@/core/api';
import type { LoginRedirectState } from '@/core/auth/guards';
import { asset } from '@/shared/lib/asset';
import { Leaves2 } from '@/shared/ui/Leaves2';
import { Leaves3 } from '@/shared/ui/Leaves3';
import { DoubleArc, SimpleArc } from '@/shared/ui/DecorativeArcs';
import { Logo } from '@/shared/ui/Logo';
import { Button } from '@/shared/ui/components/Button';
import { useLogin } from '../api/useLogin';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const redirectTo = (location.state as LoginRedirectState | null)?.from ?? '/';
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
      <div className="absolute top-20 left-20 hidden lg:block">
        <section className="flex items-center justify-center gap-5 lg:items-start lg:justify-start">
          <Logo width="50" height="50" />
          <div className="flex flex-col gap-1 text-center lg:text-start">
            <div className="flex items-center gap-5">
              <h2 className="text-5xl font-bold tracking-wider">PANGO</h2>
            </div>
            <p className="text-muted">Más control, mejores decisiones</p>
          </div>
        </section>
      </div>
      <div className="absolute top-3/7 right-0 hidden lg:block">
        <Leaves2 />
      </div>
      <div className="absolute bottom-3/7 left-0 hidden lg:block">
        <Leaves3 />
      </div>

      <section className="absolute hidden h-screen w-screen lg:block">
        <div className="absolute top-0 right-0">
          <SimpleArc
            width={'400'}
            height={'400'}
            viewBox={'0 0 162 148'}
            cx={'122'}
            cy={'26'}
            r={'122'}
            fill="#E9C7B833"
          />
        </div>
        <div className="absolute bottom-0 left-0">
          <DoubleArc
            width={'500'}
            height={'500'}
            viewBox={'0 0 480 280'}
            cx={['140', '105']}
            cy={['220', '318']}
            r={['220', '155']}
            fill={['#B5502E', '#00000033']}
          />
        </div>
        <div className="absolute right-0 bottom-0">
          <svg
            width="400"
            height="400"
            viewBox="0 0 162 148"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="125"
              cy="122"
              r="122"
              fill="none"
              stroke="#B5502E"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>
      <section className="absolute bottom-0 z-50 hidden w-screen justify-center lg:flex">
        <img src={asset('img/pangolin.png')} alt="Pango" width="150" height="150" />
      </section>

      <main className="z-50 flex max-w-screen min-w-80 flex-col items-center justify-center gap-10 overflow-hidden p-5">
        <section className="flex items-center justify-center gap-5 lg:hidden lg:items-start lg:justify-start">
          <div className="flex flex-col gap-1 text-center lg:text-start">
            <div className="flex items-center gap-5">
              <div className="lg:hidden">
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

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-4 rounded-2xl border border-line2 p-3 focus-within:border-accent">
              <FaUserLarge className="text-lg text-accent" />
              <input
                className="w-full outline-none"
                name="email"
                type="email"
                autoComplete="username"
                aria-label="Email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-line2 p-3 focus-within:border-accent">
              <RiLockPasswordFill className="text-xl text-accent" />
              <input
                className="w-full outline-none"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-label="Contraseña"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Recordarme</label>
              </div>
              <a href="/" className="text-primary">
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
              <a href="/" className="text-primary">
                Crear una
              </a>
            </p>
          </section>
        </form>
      </main>
    </div>
  );
}

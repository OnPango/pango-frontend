import { FaUserLarge } from 'react-icons/fa6';
import { RiLockPasswordFill } from 'react-icons/ri';

import { Leaves2 } from '@/shared/ui/Leaves2';
import { Leaves3 } from '@/shared/ui/Leaves3';
import { DoubleArc, SimpleArc } from '@/shared/ui/DecorativeArcs';
import { Logo } from '@/shared/ui/Logo';

export default function LoginPage() {
  return (
    <div className="grid h-screen w-full items-center justify-center">
      <div className="absolute top-20 left-20 hidden lg:block">
        <section className="flex items-center justify-center gap-5 lg:items-start lg:justify-start">
          <Logo width="40" height="40" />
          <div className="flex flex-col gap-1 text-center lg:text-start">
            <div className="flex items-center gap-5">
              <div className="lg:hidden">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M38.9001 19.8C40.1797 23.2694 40.3598 27.0487 39.4158 30.624C38.4718 34.1993 36.4496 37.3972 33.6241 39.7827C30.7986 42.1682 27.307 43.6255 23.624 43.9567C19.941 44.2878 16.2454 43.4766 13.0397 41.6333C9.83406 39.79 7.27387 37.0042 5.70731 33.6546C4.14074 30.305 3.64382 26.5541 4.28412 22.9122C4.92442 19.2702 6.67087 15.9138 9.28598 13.2994C11.9011 10.6849 15.258 8.93939 18.9001 8.30005"
                    stroke="#B5502E"
                    stroke-width="4.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M32.3001 22.2C33.0888 24.3196 33.2051 26.6308 32.633 28.8189C32.0608 31.0069 30.8282 32.9655 29.1029 34.4278C27.3776 35.89 25.2435 36.785 22.9912 36.9907C20.7389 37.1964 18.478 36.7028 16.5164 35.5773C14.5547 34.4517 12.9877 32.7489 12.0286 30.7007C11.0696 28.6524 10.7653 26.3584 11.157 24.1309C11.5487 21.9035 12.6175 19.8509 14.2178 18.2528C15.8181 16.6547 17.8721 15.5887 20.1001 15.2"
                    stroke="var(--fg)"
                    stroke-width="4"
                    stroke-linecap="round"
                  />
                  <path
                    d="M22 29.2001C23.7674 29.2001 25.2001 27.7674 25.2001 26C25.2001 24.2327 23.7674 22.8 22 22.8C20.2327 22.8 18.8 24.2327 18.8 26C18.8 27.7674 20.2327 29.2001 22 29.2001Z"
                    fill="#B5502E"
                  />
                  <path
                    d="M38 12.2C40.3196 12.2 42.2001 10.3196 42.2001 8.00005C42.2001 5.68045 40.3196 3.80005 38 3.80005C35.6805 3.80005 33.8 5.68045 33.8 8.00005C33.8 10.3196 35.6805 12.2 38 12.2Z"
                    fill="var(--fg)"
                  />
                  <path
                    d="M5.99995 43.7999C6.99406 43.7999 7.79995 42.9941 7.79995 42C7.79995 41.0058 6.99406 40.2 5.99995 40.2C5.00584 40.2 4.19995 41.0058 4.19995 42C4.19995 42.9941 5.00584 43.7999 5.99995 43.7999Z"
                    fill="var(--fg)"
                  />
                </svg>
              </div>
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

      {/* Circulos de fondo */}
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
              stroke-width="1"
              stroke-linecap="round"
            />
          </svg>
        </div>
      </section>
      <section className="absolute bottom-0 z-50 hidden w-screen justify-center lg:flex">
        <img src="./img/pangolin.png" alt="Pango" width="150" height="150" />
      </section>

      <main className="z-50 flex max-w-screen min-w-80 flex-col items-center justify-center gap-10 overflow-hidden p-5">
        <section className="flex items-center justify-center gap-5 lg:hidden lg:items-start lg:justify-start">
          <Logo width="40" height="40" />

          <div className="flex flex-col gap-1 text-center lg:text-start">
            <div className="flex items-center gap-5">
              <div className="lg:hidden">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M38.9001 19.8C40.1797 23.2694 40.3598 27.0487 39.4158 30.624C38.4718 34.1993 36.4496 37.3972 33.6241 39.7827C30.7986 42.1682 27.307 43.6255 23.624 43.9567C19.941 44.2878 16.2454 43.4766 13.0397 41.6333C9.83406 39.79 7.27387 37.0042 5.70731 33.6546C4.14074 30.305 3.64382 26.5541 4.28412 22.9122C4.92442 19.2702 6.67087 15.9138 9.28598 13.2994C11.9011 10.6849 15.258 8.93939 18.9001 8.30005"
                    stroke="#B5502E"
                    stroke-width="4.5"
                    stroke-linecap="round"
                  />
                  <path
                    d="M32.3001 22.2C33.0888 24.3196 33.2051 26.6308 32.633 28.8189C32.0608 31.0069 30.8282 32.9655 29.1029 34.4278C27.3776 35.89 25.2435 36.785 22.9912 36.9907C20.7389 37.1964 18.478 36.7028 16.5164 35.5773C14.5547 34.4517 12.9877 32.7489 12.0286 30.7007C11.0696 28.6524 10.7653 26.3584 11.157 24.1309C11.5487 21.9035 12.6175 19.8509 14.2178 18.2528C15.8181 16.6547 17.8721 15.5887 20.1001 15.2"
                    stroke="var(--fg)"
                    stroke-width="4"
                    stroke-linecap="round"
                  />
                  <path
                    d="M22 29.2001C23.7674 29.2001 25.2001 27.7674 25.2001 26C25.2001 24.2327 23.7674 22.8 22 22.8C20.2327 22.8 18.8 24.2327 18.8 26C18.8 27.7674 20.2327 29.2001 22 29.2001Z"
                    fill="#B5502E"
                  />
                  <path
                    d="M38 12.2C40.3196 12.2 42.2001 10.3196 42.2001 8.00005C42.2001 5.68045 40.3196 3.80005 38 3.80005C35.6805 3.80005 33.8 5.68045 33.8 8.00005C33.8 10.3196 35.6805 12.2 38 12.2Z"
                    fill="var(--fg)"
                  />
                  <path
                    d="M5.99995 43.7999C6.99406 43.7999 7.79995 42.9941 7.79995 42C7.79995 41.0058 6.99406 40.2 5.99995 40.2C5.00584 40.2 4.19995 41.0058 4.19995 42C4.19995 42.9941 5.00584 43.7999 5.99995 43.7999Z"
                    fill="var(--fg)"
                  />
                </svg>
              </div>
              <h2 className="text-5xl font-bold tracking-wider">PANGO</h2>
            </div>
            <p className="text-muted">Más control, mejores decisiones</p>
          </div>
        </section>
        <form
          onSubmit={() => {}}
          className="w-full space-y-5 rounded-4xl border border-line bg-surface px-12 py-8 shadow-lg"
        >
          <h4 className="text-md m-0 font-light tracking-wide">BIENVENIDO A PANGO</h4>
          {/*pequeña linea*/}
          <div className="w-9 border-3 border-b border-primary" />

          <section className="-space-y-1 text-xl">
            <h2>Iniciar sesión para</h2>
            <h2>continuar</h2>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-4 rounded-2xl border border-line p-3 focus-within:border-accent">
              <FaUserLarge className="text-lg text-accent" />
              <input className="w-full outline-none" placeholder="Email" />
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-line p-3 focus-within:border-accent">
              <RiLockPasswordFill className="text-xl text-accent" />
              <input className="w-full outline-none" type="password" placeholder="Contraseña" />
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1">
                <input type="checkbox" />
                <label htmlFor="remember">Recordarme</label>
              </div>
              <a href="/" className="text-primary">
                Olvidé mi contraseña
              </a>
            </div>
          </section>
          <section className="space-y-2">
            <button className="w-full cursor-pointer rounded-xl bg-primary p-2 text-primary-fg hover:bg-accent">
              Iniciar sesión
            </button>
            <div className="flex items-center justify-center gap-2 text-muted">
              <div className="h-px w-full bg-canvas"></div>o
              <div className="h-px w-full bg-canvas"></div>
            </div>
            <button className="btn-primary w-full cursor-pointer rounded-xl bg-canvas p-2">
              Acceso con SSO
            </button>
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

import { FiGlobe } from 'react-icons/fi';
import { WORKSPACE_DOMAIN } from '@/core/tenant/tenant';
import { asset } from '@/shared/lib/asset';
import { Logo } from '@/shared/ui/Logo';

interface RegisterHeroProps {
  /** What the person typed as their workspace address; shown live in the preview pill. */
  slug: string;
}

/** Brand panel of the registration screen (large screens). Purely decorative apart from the copy. */
export function RegisterHero({ slug }: RegisterHeroProps) {
  return (
    <aside className="relative hidden w-5/12 shrink-0 flex-col justify-between overflow-hidden bg-primary/10 p-12 lg:flex">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-28 size-96 animate-drift rounded-full bg-primary/20" />
        <div className="absolute -bottom-44 -left-36 size-96 animate-drift rounded-[55%_45%_60%_40%] bg-primary/90 [animation-delay:-6s]" />
        <div className="absolute -bottom-56 -left-12 h-72 w-96 animate-drift rounded-full bg-primary [animation-delay:-11s]" />
        <div className="absolute top-1/3 -right-10 size-40 animate-drift rounded-full border border-primary/40 [animation-delay:-3s]" />
      </div>

      <a href="/" aria-label="Pango, ir al inicio" className="relative inline-flex w-fit">
        <Logo width="140" height="48" src="logos/pango-logo-horizontal-marron.svg" />
      </a>

      <div className="relative flex flex-col items-center gap-4 pb-16 text-center">
        <img
          src={asset('img/pangolin.png')}
          alt=""
          width="220"
          height="220"
          className="animate-float drop-shadow-xl"
        />
        <h2 className="max-w-sm text-3xl leading-tight font-bold">Tu propio espacio en minutos</h2>
        <p className="max-w-sm text-muted">
          Cada empresa tiene su dirección. Ahí viven tus datos, tu inventario y tu equipo.
        </p>
        <div className="mt-1 inline-flex max-w-full items-center gap-2.5 rounded-full border border-line2 bg-surface px-5 py-2.5 font-semibold shadow-lg">
          <FiGlobe aria-hidden className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 truncate">
            <span className="text-primary">{slug || 'tuempresa'}</span>.{WORKSPACE_DOMAIN}
          </span>
        </div>
      </div>
    </aside>
  );
}

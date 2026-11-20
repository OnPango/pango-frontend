import { asset } from '@/shared/lib/asset';
import { Leaves2 } from '@/shared/ui/Leaves2';
import { Leaves3 } from '@/shared/ui/Leaves3';
import { DoubleArc, SimpleArc } from '@/shared/ui/DecorativeArcs';
import { Logo } from '@/shared/ui/Logo';

/**
 * Brand mark, leaves, arcs and pangolin shared by the public auth screens. It renders absolutely
 * positioned siblings (large screens only): place it inside a `relative` container, before the content.
 */
export function AuthBackdrop() {
  return (
    <>
      <div className="absolute top-20 left-20 hidden xl:block">
        <section className="flex items-center justify-center gap-5 xl:items-start xl:justify-start">
          <Logo width="50" height="50" />
          <div className="flex flex-col gap-1 text-center xl:text-start">
            <div className="flex items-center gap-5">
              <h2 className="text-5xl font-bold tracking-wider">PANGO</h2>
            </div>
            <p className="text-muted">Más control, mejores decisiones</p>
          </div>
        </section>
      </div>
      <div className="absolute top-3/7 right-0 hidden xl:block">
        <Leaves2 />
      </div>
      <div className="absolute bottom-3/7 left-0 hidden xl:block">
        <Leaves3 />
      </div>

      <section className="absolute hidden h-screen w-screen xl:block">
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
      <section className="absolute bottom-0 z-50 hidden w-screen justify-center xl:flex">
        <img src={asset('img/pangolin.png')} alt="Pango" width="150" height="150" />
      </section>
    </>
  );
}

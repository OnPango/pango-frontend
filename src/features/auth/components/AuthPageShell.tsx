import type { ReactNode } from 'react';
import { Logo } from '@/shared/ui/Logo';
import { cn } from '@/shared/lib/cn';
import { AuthBackdrop } from './AuthBackdrop';

/**
 * Frame of the public single-card screens (login, confirm email, accept invitation): brand
 * decoration behind, and one scrolling layer on top (the app shell is `overflow: hidden`), so short
 * screens can reach the whole card. `m-auto` centers it while it fits and scrolls from the top once it
 * does not.
 *
 * The width never depends on the content: `main` is capped (`max-w-130`) and the card fills it up to
 * 30rem, so a long error message wraps instead of stretching the card.
 */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <AuthBackdrop />

      <div className="absolute inset-0 z-50 flex overflow-y-auto">
        <main className="m-auto flex w-full max-w-130 min-w-80 flex-col items-center justify-center gap-10 p-5">
          <section className="flex items-center justify-center gap-5 xl:hidden">
            <div className="flex flex-col gap-1 text-center">
              <div className="flex items-center gap-5">
                <Logo width="50" height="50" />
                <h2 className="text-5xl font-bold tracking-wider">PANGO</h2>
              </div>
              <p className="text-muted">Más control, mejores decisiones</p>
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * White card with the Pango heading used by those screens. Fixed width (30rem, less on small
 * screens) whatever it holds; long words and addresses break rather than overflow.
 */
export function AuthCard({
  eyebrow,
  title,
  className,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'w-full max-w-105 space-y-5 rounded-[45px] border border-line2 bg-surface px-8 py-10 wrap-break-word shadow-lg sm:px-12',
        className,
      )}
    >
      <h4 className="text-md m-0 font-light tracking-wide">{eyebrow}</h4>
      <div className="w-9 border-3 border-b border-primary" />
      <div className="text-xl">{title}</div>
      {children}
    </div>
  );
}

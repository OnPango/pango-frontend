import type { ReactNode } from 'react';
import { asset } from '@/shared/lib/asset';
import { cn } from '@/shared/lib/cn';
import { PangoBackdrop } from '@/shared/ui/components/PangoBackdrop';

interface StatusPageProps {
  /** Large faded code behind the content ("404"). Purely decorative. */
  code?: string;
  /** Small label above the title; this is what screen readers get instead of the decorative code. */
  eyebrow: string;
  /** Keep the eyebrow for screen readers only, when the picture already shows the code. */
  hideEyebrow?: boolean;
  /** The picture above the text. Defaults to Pango peeking. */
  illustration?: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  /** Extra content between the description and the actions (e.g. technical details). */
  children?: ReactNode;
}

/**
 * Layout shared by the full-screen status pages (404, 403, unexpected error). It fills whatever
 * contains it, so it works both on its own and inside the app layout, next to the sidebar.
 */
export function StatusPage({
  code,
  eyebrow,
  hideEyebrow = false,
  illustration,
  title,
  description,
  actions,
  children,
}: StatusPageProps) {
  return (
    <section className="relative isolate flex h-full min-h-96 flex-col items-center justify-center gap-6 overflow-hidden p-6 text-center">
      {/* The same scenery as the loading screens; the logo is already in the app's header. */}
      <PangoBackdrop brand={false} delayMs={0} />

      {code && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[12rem] leading-none font-bold text-fg opacity-5 select-none md:text-[24rem]"
        >
          {code}
        </span>
      )}

      {illustration ?? (
        <img src={asset('img/pangolin.png')} alt="" width="150" height="150" className="relative" />
      )}

      <div className="relative flex max-w-xl flex-col gap-2">
        <p
          className={cn(
            'text-sm font-semibold tracking-widest text-primary uppercase',
            hideEyebrow && 'sr-only',
          )}
        >
          {eyebrow}
        </p>
        <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
        <p className="text-muted md:text-lg">{description}</p>
      </div>

      {children}

      {actions && <div className="relative flex flex-wrap justify-center gap-3">{actions}</div>}
    </section>
  );
}

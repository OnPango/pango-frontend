import { FiDownload } from 'react-icons/fi';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { KIND_COPY } from '../content/imports.labels';
import { downloadTemplate } from '../lib/template';
import type { ImportKind } from '../types/imports.types';

export interface KindCardProps {
  kind: ImportKind;
  /** "Paso 1 recomendado" on the first load of an organization. */
  badge?: string;
  /** Not available yet: the card is shown, its buttons are not usable. */
  disabled?: boolean;
  onStart: () => void;
}

/** One of the two things that can be loaded, with what its file needs. */
export function KindCard({ kind, badge, disabled = false, onStart }: KindCardProps) {
  const copy = KIND_COPY[kind];
  return (
    <article className="flex flex-col rounded-3xl border border-line2 bg-surface p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-fg">{copy.title}</h2>
        {badge && (
          <Badge tone="primary" size="sm">
            {badge}
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{copy.description}</p>
      <p className="mt-4 text-xs font-semibold text-muted uppercase">Tu archivo necesita</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {copy.needs.map((need) => (
          <li key={need}>
            <Badge tone="neutral" size="sm">
              {need}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex-1 text-sm text-muted">{copy.usage}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={onStart} disabled={disabled}>
          {copy.cta}
        </Button>
        <Button variant="outline" onClick={() => downloadTemplate(kind)} disabled={disabled}>
          <FiDownload aria-hidden className="mr-2" />
          Plantilla
        </Button>
      </div>
    </article>
  );
}

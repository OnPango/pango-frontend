import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { FiCheck, FiInfo, FiX } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { Spinner } from '@/shared/ui/components/Spinner';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { WORKSPACE_DOMAIN, type WorkspaceStatus } from '../lib/register.rules';

interface WorkspaceAddressFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  slug: string;
  status: WorkspaceStatus;
  /** Validation error from the form schema (shown instead of the availability message). */
  error?: string;
}

function statusContent(
  status: WorkspaceStatus,
  slug: string,
): { icon: ReactNode; text: string; tone: string } {
  switch (status) {
    case 'invalid':
      return {
        icon: <FiX />,
        tone: 'text-danger',
        text: 'Usa de 3 a 30 caracteres: minúsculas, números y guiones, sin terminar en guion.',
      };
    case 'checking':
      return {
        icon: <Spinner className="size-3.5" />,
        tone: 'text-muted',
        text: 'Comprobando disponibilidad…',
      };
    case 'available':
      return {
        icon: <FiCheck />,
        tone: 'text-success',
        text: `Disponible. Tu espacio será ${slug}.${WORKSPACE_DOMAIN}`,
      };
    case 'taken':
      return {
        icon: <FiX />,
        tone: 'text-danger',
        text: `Esa dirección ya está en uso. Prueba con ${slug}-co.`,
      };
    case 'unknown':
      return {
        icon: <FiInfo />,
        tone: 'text-muted',
        text: 'No pudimos comprobar la disponibilidad ahora; la confirmaremos al crear tu cuenta.',
      };
    case 'empty':
      return {
        icon: <FiInfo />,
        tone: 'text-muted',
        text: 'Es la dirección donde tú y tu equipo entran. Solo minúsculas, números y guiones.',
      };
  }
}

/** Slug input with the `.onpango.com` suffix and live availability feedback. Forwards its ref (for `register`). */
export const WorkspaceAddressField = forwardRef<HTMLInputElement, WorkspaceAddressFieldProps>(
  function WorkspaceAddressField({ slug, status, error, ...inputProps }, ref) {
    const messageId = useId();
    const { icon, text, tone } = statusContent(status, slug);

    return (
      <div>
        <TextBox
          ref={ref}
          label="Dirección de tu espacio"
          required
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="tuempresa"
          error={error}
          invalid={status === 'taken' || status === 'invalid'}
          aria-describedby={error ? undefined : messageId}
          trailing={
            <span className="shrink-0 rounded-lg bg-fg/5 px-2.5 py-1 text-sm font-semibold text-muted">
              .{WORKSPACE_DOMAIN}
            </span>
          }
          {...inputProps}
        />
        {!error && (
          <p
            // Remounting on each status change replays the entrance animation.
            key={status}
            id={messageId}
            role="status"
            className={cn(
              'mt-1.5 flex animate-fade-up items-start gap-2 text-xs font-medium',
              tone,
            )}
          >
            <span aria-hidden className="mt-px shrink-0 [&>svg]:size-3.5">
              {icon}
            </span>
            <span>{text}</span>
          </p>
        )}
      </div>
    );
  },
);

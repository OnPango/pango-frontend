import { useState, type FormEvent } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import {
  isValidSubdomain,
  redirectToTenant,
  slugify,
  WORKSPACE_DOMAIN,
} from '@/core/tenant/tenant';
import { Button } from '@/shared/ui/components/Button';
import { useCheckWorkspace, workspaceState } from '../api/useWorkspace';
import { getAuthErrorMessage } from '../lib/auth.errors';
import { TextBox } from '@/shared/ui/components/form/TextBox';

/**
 * Login on the main domain: sessions belong to one organization, so first find its address
 * (`mi-empresa.onpango.com`) and continue there.
 */
export function FindWorkspaceForm() {
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const check = useCheckWorkspace();

  // Ask the API whether the space exists before leaving for an address that would only fail.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidSubdomain(subdomain)) {
      setError('Escribe la dirección de tu espacio, por ejemplo mi-empresa.');
      return;
    }
    check.mutate(subdomain, {
      onSuccess: () => redirectToTenant(subdomain, '/login'),
      onError: (err) => {
        const state = workspaceState(err, false);
        // A failure that says nothing about the space (network…) does not block: its page will tell.
        if (state === 'unknown') redirectToTenant(subdomain, '/login');
        else setError(getAuthErrorMessage(err, 'No encontramos ese espacio.'));
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <TextBox
        label="Dirección de tu espacio"
        required
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="mi-empresa"
        value={subdomain}
        onChange={(event) => {
          setSubdomain(slugify(event.target.value));
          setError(null);
        }}
        error={error ?? undefined}
        hint="La que te dio tu administrador al crear la cuenta."
        trailing={
          <span className="shrink-0 rounded-lg bg-fg/5 px-2.5 py-1 text-sm font-semibold text-muted">
            .{WORKSPACE_DOMAIN}
          </span>
        }
      />
      <Button type="submit" size="lg" className="group w-full gap-2.5" isLoading={check.isPending}>
        Continuar
        <FiArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
      </Button>
    </form>
  );
}

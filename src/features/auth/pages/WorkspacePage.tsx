import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { env } from '@/core/config/env';
import { http } from '@/core/api/http';
import { isValidSubdomain } from '@/core/tenant/tenant';
import { Logo } from '@/shared/ui/Logo';

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = workspace.trim().toLowerCase();
    setError('');
    if (!isValidSubdomain(slug)) {
      setError('Escribe un subdominio válido de empresa.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await http.get<{ subdomain: string }>('/organizations/current', {
        headers: { 'X-Tenant': slug },
      });
      if (data.subdomain !== slug) throw new Error('Unexpected tenant');
      window.location.assign(`https://${slug}.${env.appBaseDomain}/login`);
    } catch (cause: unknown) {
      const status = typeof cause === 'object' && cause !== null && 'response' in cause
        ? (cause as { response?: { status?: number } }).response?.status : undefined;
      setError(status === 404 ? 'No encontramos una empresa con esa dirección.' : 'No pudimos verificar la empresa. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-canvas text-fg">
      <header className="mx-auto w-full max-w-6xl px-6 py-7">
        <a href="https://onpango.com" aria-label="Volver a Pango">
          <Logo width="130" height="44" src="logos/pango-logo-horizontal-marron.svg" />
        </a>
      </header>
      <section className="mx-auto flex w-full max-w-lg flex-1 items-center px-5 py-12">
        <div className="w-full rounded-3xl border border-line bg-card p-8 shadow-lg sm:p-10">
          <div className="mb-5 text-3xl" aria-hidden="true">⌂</div>
          <h1 className="text-3xl font-bold">Entra a tu espacio</h1>
          <p className="mt-3 text-muted">Escribe la dirección de tu empresa en Pango.</p>
          <form onSubmit={submit} className="mt-8">
            <label htmlFor="workspace" className="mb-2 block text-sm font-semibold">Dirección de tu empresa</label>
            <div className="flex overflow-hidden rounded-xl border border-line focus-within:ring-2 focus-within:ring-primary">
              <input id="workspace" type="text" required maxLength={41} autoCapitalize="off" autoComplete="organization" spellCheck={false}
                placeholder="tuempresa" value={workspace} onChange={(event) => setWorkspace(event.target.value)}
                aria-invalid={Boolean(error)} aria-describedby={error ? 'workspace-error' : 'workspace-hint'}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none" />
              <span className="flex items-center border-l border-line px-3 text-sm text-muted">.{env.appBaseDomain}</span>
            </div>
            <p id="workspace-hint" className="mt-2 text-xs text-muted">Es la dirección que registraste al crear tu cuenta.</p>
            {error && <p id="workspace-error" role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-60">
              {loading ? 'Buscando empresa…' : 'Continuar'}
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-muted">
            ¿Tu empresa aún no está en Pango?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">Crear cuenta</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

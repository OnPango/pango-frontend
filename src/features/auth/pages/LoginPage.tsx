import { buildMainUrl, getCurrentTenant, WORKSPACE_DOMAIN } from '@/core/tenant/tenant';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useWorkspace, workspaceState } from '../api/useWorkspace';
import { AuthCard, AuthPageShell } from '../components/AuthPageShell';
import { FindWorkspaceForm } from '../components/FindWorkspaceForm';
import { LoginForm } from '../components/LoginForm';

/**
 * Sessions belong to one organization, so the screen depends on where it is served from: on a
 * subdomain it is that organization's login; on the main domain it first asks for the address.
 */
export default function LoginPage() {
  const tenant = getCurrentTenant();

  return (
    <AuthPageShell>
      {tenant ? (
        <TenantLogin tenant={tenant} />
      ) : (
        <AuthCard
          eyebrow="BIENVENIDO A PANGO"
          title={
            <>
              <h2>Encuentra tu espacio</h2>
              <p className="mt-2 text-sm text-muted">
                Cada empresa tiene su propia dirección. Escríbela para iniciar sesión.
              </p>
            </>
          }
        >
          <FindWorkspaceForm />
          <p className="text-center text-sm text-muted">
            ¿Aún no tienes cuenta?{' '}
            <a href={buildMainUrl('/register')} className="text-primary">
              Crear una
            </a>
          </p>
        </AuthCard>
      )}
    </AuthPageShell>
  );
}

/**
 * On a subdomain: ask whether that organization exists (`GET /organizations/current`) before
 * asking for credentials, so a mistyped address is told at once instead of after a login attempt.
 */
function TenantLogin({ tenant }: { tenant: string }) {
  const workspace = useWorkspace(tenant);
  const state = workspaceState(workspace.error, workspace.isSuccess);

  if (workspace.isPending) {
    return (
      <AuthCard eyebrow="BIENVENIDO A PANGO" title={<h2>Buscando tu espacio…</h2>}>
        <p className="flex items-center justify-center gap-2 text-sm text-muted" role="status">
          <Spinner className="size-4" /> {tenant}.{WORKSPACE_DOMAIN}
        </p>
      </AuthCard>
    );
  }

  if (state === 'notFound' || state === 'inactive') {
    return (
      <AuthCard
        eyebrow="BIENVENIDO A PANGO"
        title={
          <>
            <h2>
              {state === 'notFound' ? 'No encontramos este espacio' : 'Este espacio no está activo'}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {state === 'notFound'
                ? `No existe ninguna empresa en ${tenant}.${WORKSPACE_DOMAIN}. Revisa la dirección.`
                : 'Contacta al administrador de tu empresa.'}
            </p>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-center text-sm">
          <a href={buildMainUrl('/login')} className="font-semibold text-primary">
            Buscar otro espacio
          </a>
          {state === 'notFound' && (
            <p className="text-muted">
              ¿Es una empresa nueva?{' '}
              <a href={buildMainUrl('/register')} className="text-primary">
                Créala
              </a>
            </p>
          )}
        </div>
      </AuthCard>
    );
  }

  // Exists, or the lookup failed for another reason (network): the login itself will tell.
  return <LoginForm tenant={tenant} organizationName={workspace.data?.legalName} />;
}

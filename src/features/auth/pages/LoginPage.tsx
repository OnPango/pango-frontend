import { buildMainUrl, getCurrentTenant } from '@/core/tenant/tenant';
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
        <LoginForm tenant={tenant} />
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

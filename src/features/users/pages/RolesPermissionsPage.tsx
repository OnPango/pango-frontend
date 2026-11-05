import { BsShieldCheck } from 'react-icons/bs';
import { useAuthStore } from '@/core/auth/auth.store';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { PageHeader } from '@/shared/ui/PageHeader';
import { PERMISSION_CATALOG } from '../content/permissions.catalog';
import { roleLabel } from '../content/fixedRoles';

/**
 * pango-core has no roles endpoints yet (no list, no create / edit): the organization works with two
 * fixed roles. Until they exist this page is read-only and shows what the session does know: the
 * roles of the signed-in user and the permissions each one grants.
 */
export default function RolesPermissionsPage() {
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles y Permisos"
        subtitle="Qué puede hacer cada rol dentro de la organización."
      />

      <Alert tone="info" title="Solo lectura">
        La organización trabaja con dos roles fijos, Propietario y Operador. Crear o editar roles
        estará disponible cuando el servidor lo permita. Abajo ves tus propios roles.
      </Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <div
            key={`${role.id}-${role.warehouse?.id ?? 'all'}`}
            className="flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-xs"
          >
            <div className="flex items-center gap-3 border-b border-line2 pb-4">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <BsShieldCheck className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-fg">{roleLabel(role.name)}</h3>
                  {role.isSystem && (
                    <Badge tone="primary" size="sm" className="tracking-wide uppercase">
                      Sistema
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {role.warehouse ? `Almacén ${role.warehouse.name}` : 'Todos los almacenes'}
                </p>
              </div>
            </div>

            <div className="py-4">
              <p className="mb-3 text-xs font-semibold text-fg">
                Permisos asignados ({role.permissions.length})
              </p>
              <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    title={PERMISSION_CATALOG[permission]?.description}
                    className="inline-flex items-center rounded-lg border border-line2 bg-canvas px-2.5 py-1 text-[11px] font-medium text-fg"
                  >
                    {PERMISSION_CATALOG[permission]?.label ?? permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

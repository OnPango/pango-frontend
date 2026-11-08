import { useMemo, useState } from 'react';
import { FiInfo } from 'react-icons/fi';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { useNavFor } from '@/shared/layout/nav.context';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Spinner } from '@/shared/ui/components/Spinner';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useRoles, useUpdateRolePermissions } from '../api/users.queries';
import { MenuPreview } from '../components/MenuPreview';
import { PermissionGroupCard } from '../components/PermissionGroupCard';
import { roleLabel } from '../content/roleLabels';
import { PERMISSION_CATEGORIES, PERMISSIONS_BY_CATEGORY } from '../content/permissions.catalog';
import { usersErrorMessage } from '../content/users.errors';
import { useRolePermissionsEditor } from '../hooks/useRolePermissionsEditor';

export default function RolesPermissionsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = hasAnyPermission(currentUser, ['role.manage']);

  const { data: roles = [], isLoading, error: queryError } = useRoles();
  const updateRole = useUpdateRolePermissions();
  const editor = useRolePermissionsEditor(roles);
  const { role, permissions } = editor;
  const menu = useNavFor(permissions);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const roleOptions = useMemo(
    () =>
      roles.map((r) => ({
        value: r.id,
        label: roleLabel(r.name),
        description: `${r.assignmentCount} ${r.assignmentCount === 1 ? 'asignación' : 'asignaciones'}${
          r.isSystem ? ' · Sistema' : ''
        }`,
      })),
    [roles],
  );

  const locked = !role || role.isSystem || !canManage;

  const handleToggle = (...args: Parameters<typeof editor.toggle>) => {
    setSaved(false);
    setSaveError(null);
    editor.toggle(...args);
  };

  // Saves every role with unsaved changes, one by one; it stops at the first failure.
  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      for (const dirty of editor.dirtyRoles) {
        const permissionsToSave = editor.draftOf(dirty.id);
        if (!permissionsToSave) continue;
        await updateRole.mutateAsync({ id: dirty.id, permissions: permissionsToSave });
        editor.clearDrafts([dirty.id]);
      }
      setSaved(true);
    } catch (err) {
      setSaveError(usersErrorMessage(err, 'No se pudieron guardar los permisos.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    editor.clearDrafts();
    setSaveError(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles y Permisos"
        subtitle="Decide qué puede hacer cada rol. El menú de cada persona cambia según lo que le permitas."
      />

      {queryError && (
        <Alert tone="danger">
          {usersErrorMessage(queryError, 'No se pudieron cargar los roles.')}
        </Alert>
      )}

      {isLoading && (
        <p role="status" className="flex items-center gap-3 text-sm text-muted">
          <Spinner /> Cargando roles y permisos…
        </p>
      )}

      {role && (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm font-medium text-muted">Editando</span>
            <details className="group relative">
              <summary
                aria-label="¿Por qué algunos permisos se activan juntos?"
                className="grid size-6 cursor-pointer list-none place-items-center rounded-full bg-primary/10 text-primary marker:hidden [&::-webkit-details-marker]:hidden"
              >
                <FiInfo aria-hidden className="size-3.5" />
              </summary>
              <div className="absolute top-8 -left-2 z-20 w-64 rounded-xl bg-fg p-3 text-xs leading-relaxed text-canvas shadow-lg">
                <b className="text-primary">Permisos relacionados</b>
                <br />
                Para atender una alerta hay que poder verla. Por eso Pango activa el permiso de ver
                cuando activas el de gestionar.
              </div>
            </details>

            <Select
              aria-label="Rol que estás editando"
              value={role.id}
              onChange={editor.select}
              options={roleOptions}
              searchable
              searchPlaceholder="Buscar rol…"
              emptyMessage="Ningún rol coincide"
              className="w-full sm:w-72"
            />

            {role.isSystem && (
              <span className="text-sm text-muted">
                El Propietario siempre tiene todo, para no dejar la organización sin gestor.
              </span>
            )}
            {!role.isSystem && !canManage && (
              <span className="text-sm text-muted">
                Solo lectura: no tienes permiso para editar roles.
              </span>
            )}
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {PERMISSION_CATEGORIES.map((category) => (
                <PermissionGroupCard
                  key={category.id}
                  title={category.label}
                  permissions={PERMISSIONS_BY_CATEGORY[category.id]}
                  granted={role.isSystem ? PERMISSIONS_BY_CATEGORY[category.id] : permissions}
                  disabled={locked}
                  onToggle={handleToggle}
                />
              ))}
            </div>

            <MenuPreview roleName={roleLabel(role.name)} sections={menu} />
          </div>
        </>
      )}

      {saveError && <Alert tone="danger">{saveError}</Alert>}
      {saved && editor.dirtyRoles.length === 0 && (
        <Alert tone="success" onDismiss={() => setSaved(false)}>
          Permisos guardados. Se aplican a las personas con este rol en su siguiente acción.
        </Alert>
      )}

      {editor.dirtyRoles.length > 0 && (
        <div
          role="status"
          className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fg px-4 py-3 text-canvas shadow-lg"
        >
          <span className="text-sm">Tienes cambios sin guardar.</span>
          <span className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              Descartar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              isLoading={isSaving}
            >
              Guardar permisos
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}

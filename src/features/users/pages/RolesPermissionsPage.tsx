import { useMemo, useState } from 'react';
import { FiEdit2, FiInfo, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { useNavFor } from '@/shared/layout/nav.context';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Spinner } from '@/shared/ui/components/Spinner';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useInvitations, useRoles, useUpdateRolePermissions } from '../api/users.queries';
import { DeleteRoleDialog } from '../components/DeleteRoleDialog';
import { MenuPreview } from '../components/MenuPreview';
import { PermissionGroupCard } from '../components/PermissionGroupCard';
import { RoleFormModal } from '../components/RoleFormModal';
import { roleDescription, roleLabel } from '../content/roleLabels';
import { PERMISSION_CATEGORIES, PERMISSIONS_BY_CATEGORY } from '../content/permissions.catalog';
import { usersErrorMessage } from '../content/users.errors';
import { useRolePermissionsEditor } from '../hooks/useRolePermissionsEditor';
import type { ManagedRole } from '../types/users.types';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function RolesPermissionsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canManage = hasAnyPermission(currentUser, ['role.manage']);
  const isOwner = currentUser?.roles.some((grant) => grant.isSystem) ?? false;
  // Pending invitations also keep a role from being deleted; they are listed with `user.read`.
  const invitations = useInvitations({
    enabled: canManage && hasAnyPermission(currentUser, ['user.read', 'user.manage']),
  });

  const { data: roles = [], isLoading, error: queryError } = useRoles();
  const updateRole = useUpdateRolePermissions();
  const editor = useRolePermissionsEditor(roles);
  const { role, permissions } = editor;
  const menu = useNavFor(permissions);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** 'new', the role being renamed, or null. */
  const [formFor, setFormFor] = useState<'new' | ManagedRole | null>(null);
  const [deleting, setDeleting] = useState<ManagedRole | null>(null);

  // Anyone but the Owner only gives the permissions they hold (the backend checks it too).
  const grantable = useMemo(
    () => (isOwner ? null : new Set(currentUser?.permissions ?? [])),
    [isOwner, currentUser],
  );

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

  // Only the Owner edits a role they hold: nobody raises their own level.
  const heldByYou =
    !!role && !isOwner && (currentUser?.roles.some((grant) => grant.id === role.id) ?? false);
  const locked = !role || role.isSystem || !canManage || heldByYou;

  const deleteBlocker = (target: ManagedRole) => {
    if (target.assignmentCount > 0) {
      return `Está asignado ${count(target.assignmentCount, 'vez', 'veces')}. Quítaselo a esas personas en Usuarios y vuelve a intentarlo.`;
    }
    const pending = (invitations.data ?? []).filter(
      (invitation) => invitation.roleId === target.id,
    ).length;
    if (pending > 0) {
      return `Lo ${pending === 1 ? 'ofrece' : 'ofrecen'} ${count(pending, 'invitación pendiente', 'invitaciones pendientes')}. Revócalas en Usuarios y vuelve a intentarlo.`;
    }
    return null;
  };

  const startAction = () => {
    setNotice(null);
    setSaved(false);
  };

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
        onAction={
          canManage
            ? () => {
                startAction();
                setFormFor('new');
              }
            : undefined
        }
        icon={FiPlus}
        actionText="Nuevo rol"
      />

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-2">
            <div className="flex gap-2">
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
            </div>
            <div className='flex gap-2'>
              <Select
                aria-label="Rol que estás editando"
                value={role.id}
                onChange={editor.select}
                options={roleOptions}
                searchable
                searchPlaceholder="Buscar rol…"
                emptyMessage="Ningún rol coincide"
                className="flex-1 sm:w-72"
              />

              {canManage && !role.isSystem && (
                <span className="flex gap-1">
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    disabled={heldByYou}
                    onClick={() => {
                      startAction();
                      setFormFor(role);
                    }}
                    className="gap-1.5 p-3"
                  >
                    <FiEdit2 aria-hidden className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={heldByYou}
                    onClick={() => {
                      startAction();
                      setDeleting(role);
                    }}
                    className="gap-1.5 p-3"
                  >
                    <FiTrash2 aria-hidden className="size-4" />
                  </Button>
                </span>
              )}
            </div>

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
            {heldByYou && canManage && (
              <span className="text-sm text-muted">
                Tienes este rol asignado: solo el Propietario puede cambiarlo o eliminarlo.
              </span>
            )}
          </div>
          {role.description && (
            <p className="-mt-3 text-sm text-muted">{roleDescription(role.description)}</p>
          )}

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

      <RoleFormModal
        isOpen={formFor !== null}
        role={formFor === 'new' ? null : formFor}
        roles={roles}
        grantable={grantable}
        onClose={() => setFormFor(null)}
        onSaved={(saved) => {
          const created = formFor === 'new';
          setFormFor(null);
          editor.select(saved.id);
          setNotice(
            created
              ? `Rol «${roleLabel(saved.name)}» creado. Ajusta aquí sus permisos y luego dáselo a las personas en Usuarios.`
              : `Rol «${roleLabel(saved.name)}» actualizado.`,
          );
        }}
      />
      {deleting && (
        <DeleteRoleDialog
          role={deleting}
          blocker={deleteBlocker(deleting)}
          hasDraft={editor.dirtyRoles.some((dirty) => dirty.id === deleting.id)}
          onClose={() => setDeleting(null)}
          onDeleted={(deleted) => {
            setDeleting(null);
            editor.clearDrafts([deleted.id]);
            editor.select(null);
            setNotice(`Rol «${roleLabel(deleted.name)}» eliminado.`);
          }}
        />
      )}
    </div>
  );
}

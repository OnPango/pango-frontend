import { useState } from 'react';
import type { Permission } from '@/core/auth/user';
import { samePermissions, withPermission, withoutPermission } from '../content/permissions.rules';
import type { ManagedRole } from '../types/users.types';

/**
 * State of the roles editor: which role is open and the unsaved permission changes of every role
 * (a draft per role, so switching roles never loses work). Nothing here talks to the API.
 */
export function useRolePermissionsEditor(roles: ManagedRole[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Permission[]>>({});

  // Open an editable role first: the system role cannot change.
  const role =
    roles.find((r) => r.id === selectedId) ?? roles.find((r) => !r.isSystem) ?? roles[0] ?? null;

  const permissions = role ? (drafts[role.id] ?? role.permissions) : [];
  const dirtyRoles = roles.filter(
    (r) => drafts[r.id] && !samePermissions(drafts[r.id]!, r.permissions),
  );

  const toggle = (permission: Permission, granted: boolean) => {
    if (!role || role.isSystem) return;
    const next = granted
      ? withPermission(permissions, permission)
      : withoutPermission(permissions, permission);
    setDrafts((current) => ({ ...current, [role.id]: next }));
  };

  /** Forgets the unsaved changes of these roles (after saving them), or of all of them. */
  const clearDrafts = (ids?: string[]) =>
    setDrafts((current) => {
      if (!ids) return {};
      const next = { ...current };
      for (const id of ids) delete next[id];
      return next;
    });

  return {
    role,
    permissions,
    select: setSelectedId,
    toggle,
    draftOf: (id: string) => drafts[id],
    dirtyRoles,
    clearDrafts,
  };
}

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FIXED_ROLES } from '../content/fixedRoles';
import type { ManagedUser, RoleOption } from '../types/users.types';
import {
  getInvitations,
  getUsers,
  getWarehouses,
  inviteUser,
  revokeInvitation,
  setUserActive,
  setUserRoles,
  updateUser,
} from './users.api';
import { usersKeys } from './users.keys';

export function useUsers() {
  return useQuery({ queryKey: usersKeys.lists(), queryFn: getUsers });
}

export function useInvitations() {
  return useQuery({ queryKey: usersKeys.invitations(), queryFn: getInvitations });
}

export function useWarehouses() {
  return useQuery({ queryKey: usersKeys.warehouses(), queryFn: getWarehouses, staleTime: 300_000 });
}

/**
 * The roles a user can be given. Without a roles endpoint (see `fixedRoles.ts`) they are the two
 * fixed ones, overridden by whatever real roles show up in the users and invitations already loaded.
 */
export function useRoleOptions(): RoleOption[] {
  const { data: users } = useUsers();
  const { data: invitations } = useInvitations();

  return useMemo(() => {
    const byName = new Map(FIXED_ROLES.map((role) => [role.name, role]));
    for (const user of users ?? []) {
      for (const role of user.roles) {
        byName.set(role.roleName, {
          id: role.roleId,
          name: role.roleName,
          isSystem: role.isSystem,
        });
      }
    }
    for (const invitation of invitations ?? []) {
      const known = byName.get(invitation.roleName);
      if (invitation.roleName && known)
        byName.set(invitation.roleName, { ...known, id: invitation.roleId });
    }
    return [...byName.values()];
  }, [users, invitations]);
}

/** Puts the user the API answered with in the cached list, then refetches it. */
function useApplyUser() {
  const queryClient = useQueryClient();
  return (updated: ManagedUser) => {
    queryClient.setQueryData<ManagedUser[]>(usersKeys.lists(), (old = []) =>
      old.map((user) => (user.id === updated.id ? updated : user)),
    );
    void queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
  };
}

export function useUpdateUser() {
  const apply = useApplyUser();
  return useMutation({ mutationFn: updateUser, onSuccess: apply });
}

export function useSetUserRoles() {
  const apply = useApplyUser();
  return useMutation({ mutationFn: setUserRoles, onSuccess: apply });
}

export function useSetUserActive() {
  const apply = useApplyUser();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setUserActive(id, isActive),
    onSuccess: apply,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.invitations() }),
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.invitations() }),
  });
}

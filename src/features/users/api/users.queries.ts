import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ManagedRole, ManagedUser, RoleOption } from '../types/users.types';
import {
  changeUserRoles,
  getInvitations,
  getRoles,
  getUsers,
  getWarehouses,
  inviteUser,
  revokeInvitation,
  setUserActive,
  updateRolePermissions,
  updateUser,
} from './users.api';
import { usersKeys } from './users.keys';

export function useUsers() {
  return useQuery({ queryKey: usersKeys.lists(), queryFn: getUsers });
}

export function useRoles() {
  return useQuery({ queryKey: usersKeys.roles(), queryFn: getRoles });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRolePermissions,
    onSuccess: (updated) => {
      queryClient.setQueryData<ManagedRole[]>(usersKeys.roles(), (old = []) =>
        old.map((role) => (role.id === updated.id ? updated : role)),
      );
      // What the role allows changed what its holders can see and do.
      void queryClient.invalidateQueries({ queryKey: usersKeys.roles() });
    },
  });
}

export function useInvitations() {
  return useQuery({ queryKey: usersKeys.invitations(), queryFn: getInvitations });
}

export function useWarehouses() {
  return useQuery({ queryKey: usersKeys.warehouses(), queryFn: getWarehouses, staleTime: 300_000 });
}

/** The roles a user can be given: the organization's roles, from `GET /roles`. */
export function useRoleOptions(): RoleOption[] {
  const { data: roles } = useRoles();
  return useMemo(
    () => (roles ?? []).map((role) => ({ id: role.id, name: role.name, isSystem: role.isSystem })),
    [roles],
  );
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

export function useChangeUserRoles() {
  const apply = useApplyUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changeUserRoles,
    onSuccess: apply,
    // Roles are changed one call at a time: after a failure some may already apply.
    onError: () => queryClient.invalidateQueries({ queryKey: usersKeys.lists() }),
    // The role's assignment count changed too.
    onSettled: () => queryClient.invalidateQueries({ queryKey: usersKeys.roles() }),
  });
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

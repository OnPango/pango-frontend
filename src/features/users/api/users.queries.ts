import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRole,
  createUser,
  getAreas,
  getRoles,
  getUser,
  getUsers,
  toggleUserStatus,
  updateRole,
  updateUser,
} from './users.api';
import { usersKeys } from './users.keys';
import type { ManagedUser } from '../types/users.types';

export function useUsers() {
  return useQuery({
    queryKey: usersKeys.lists(),
    queryFn: getUsers,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: usersKeys.roles(),
    queryFn: getRoles,
  });
}

export function useAreas() {
  return useQuery({
    queryKey: usersKeys.areas(),
    queryFn: getAreas,
  });
}
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: (newUser) => {
      queryClient.setQueryData<ManagedUser[]>(usersKeys.lists(), (old = []) => [
        newUser,
        ...old.filter((u) => u.id !== newUser.id),
      ]);
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
      void queryClient.invalidateQueries({ queryKey: usersKeys.roles() });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updated) => {
      queryClient.setQueryData<ManagedUser[]>(usersKeys.lists(), (old = []) =>
        old.map((u) => (u.id === updated.id ? updated : u)),
      );
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
      void queryClient.invalidateQueries({ queryKey: usersKeys.detail(updated.id) });
      void queryClient.invalidateQueries({ queryKey: usersKeys.roles() });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleUserStatus(id, isActive),
    onSuccess: (updated) => {
      queryClient.setQueryData<ManagedUser[]>(usersKeys.lists(), (old = []) =>
        old.map((u) => (u.id === updated.id ? updated : u)),
      );
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
      void queryClient.invalidateQueries({ queryKey: usersKeys.detail(updated.id) });
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.roles() });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRole,
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: usersKeys.roleDetail(updated.id) });
      // Invalidate users list since role name/permissions might affect user display
      void queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

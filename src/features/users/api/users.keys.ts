export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  invitations: () => [...usersKeys.all, 'invitations'] as const,
  warehouses: () => ['warehouses'] as const,
  roles: () => ['roles'] as const,
};

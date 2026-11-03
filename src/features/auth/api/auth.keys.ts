export const authKeys = {
  all: ['auth'] as const,
  workspaceAvailability: (slug: string) =>
    [...authKeys.all, 'workspace-availability', slug] as const,
};

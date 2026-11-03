import { useQuery } from '@tanstack/react-query';
import { WORKSPACE_SLUG_PATTERN } from '../lib/register.rules';
import { authKeys } from './auth.keys';
import { checkWorkspaceAvailability } from './auth.service';

/** Whether `<slug>.onpango.com` is free. Only asks about well-formed slugs. */
export function useWorkspaceAvailability(slug: string) {
  return useQuery({
    queryKey: authKeys.workspaceAvailability(slug),
    queryFn: ({ signal }) => checkWorkspaceAvailability(slug, signal),
    enabled: WORKSPACE_SLUG_PATTERN.test(slug),
    staleTime: 30_000,
    retry: false,
  });
}

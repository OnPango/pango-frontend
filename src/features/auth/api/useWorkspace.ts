import { useMutation, useQuery } from '@tanstack/react-query';
import { authHttp } from '@/core/api/authHttp';
import { getApiErrorCode } from '@/core/api/errors';

/** What anyone may learn about an organization from its subdomain. */
export interface Workspace {
  subdomain: string;
  legalName: string;
}

/**
 * `GET /organizations/current` for `subdomain` (public, no session). Answers `404
 * ORGANIZATION_NOT_FOUND` when it does not exist and `403 ORGANIZATION_INACTIVE` when it is
 * suspended.
 */
export async function getWorkspace(subdomain: string): Promise<Workspace> {
  const { data } = await authHttp.get<Workspace>('/organizations/current', {
    headers: { 'X-Tenant': subdomain },
  });
  return data;
}

export type WorkspaceState = 'exists' | 'notFound' | 'inactive' | 'unknown';

/** The lookup's outcome, without mistaking a network failure for "it does not exist". */
export function workspaceState(error: unknown, found: boolean): WorkspaceState {
  if (found) return 'exists';
  const code = getApiErrorCode(error);
  if (code === 'ORGANIZATION_NOT_FOUND') return 'notFound';
  if (code === 'ORGANIZATION_INACTIVE') return 'inactive';
  return 'unknown';
}

const workspaceKey = (subdomain: string) => ['workspace', subdomain] as const;

/** The organization of `subdomain`; the answer is kept for the session (it rarely changes). */
export function useWorkspace(subdomain: string | null, enabled = true) {
  return useQuery({
    queryKey: workspaceKey(subdomain ?? ''),
    queryFn: () => getWorkspace(subdomain ?? ''),
    enabled: enabled && subdomain !== null,
    retry: false,
    staleTime: Infinity,
  });
}

/** For a form that checks an address on submit ("Encuentra tu espacio"). */
export function useCheckWorkspace() {
  return useMutation({ mutationFn: getWorkspace });
}

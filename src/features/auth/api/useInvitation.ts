import { useMutation, useQuery } from '@tanstack/react-query';
import { applySession } from '@/core/auth/session.api';
import { authKeys } from './auth.keys';
import { acceptInvitation, getInvitationPreview } from './auth.service';

/** What the accept page shows before the form. `retry: false`: an invalid link will not fix itself. */
export function useInvitationPreview(token: string) {
  return useQuery({
    queryKey: authKeys.invitationPreview(token),
    queryFn: () => getInvitationPreview(token),
    enabled: token !== '',
    retry: false,
    staleTime: Infinity,
  });
}

/** Accepting joins the organization and logs in: the returned session is started right away. */
export function useAcceptInvitation() {
  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (session) => applySession(session),
  });
}

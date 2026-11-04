import { useMutation, useQuery } from '@tanstack/react-query';
import { resendVerification, verifyEmail } from '@/core/auth/auth.api';
import { authKeys } from './auth.keys';

/**
 * Consumes the token of the emailed link as soon as the page opens. A query (not a mutation in an
 * effect) so React StrictMode's double render shares one request: tokens work once, and a second
 * call would report the link as already used.
 */
export function useEmailVerification(token: string) {
  return useQuery({
    queryKey: authKeys.emailVerification(token),
    queryFn: () => verifyEmail(token),
    enabled: token !== '',
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: ({ email, subdomain }: { email: string; subdomain?: string }) =>
      resendVerification(email, subdomain),
  });
}

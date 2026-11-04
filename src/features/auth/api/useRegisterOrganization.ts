import { useMutation } from '@tanstack/react-query';
import { signup } from '@/core/auth/auth.api';
import type { SignupDto } from '@/core/auth/auth.dto';
import { toSignupResult } from './auth.mappers';

/**
 * Owner sign-up mutation. No session is started: the owner confirms the email and logs in on the
 * new subdomain. Resolves with what the UI needs (`SignupResult`), not with the raw response.
 */
export function useRegisterOrganization() {
  return useMutation({
    mutationFn: async (request: SignupDto) => toSignupResult(await signup(request), request),
  });
}

import { useMutation } from '@tanstack/react-query';
import { signup } from '@/core/auth/auth.api';

/** Owner sign-up mutation. No session is started: the owner confirms the email and logs in on the new subdomain. */
export function useRegisterOrganization() {
  return useMutation({ mutationFn: signup });
}

import { useMutation } from '@tanstack/react-query';
import { signup } from './auth.service';

/** Owner sign-up mutation. No session is started: the owner confirms the email and logs in on the new subdomain. */
export function useRegisterOrganization() {
  return useMutation({ mutationFn: signup });
}

import { useMutation } from '@tanstack/react-query';
import { registerOrganization } from './auth.service';

/** Registration mutation. No session is created: the caller redirects to the login on success. */
export function useRegisterOrganization() {
  return useMutation({ mutationFn: registerOrganization });
}

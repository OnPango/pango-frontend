import { useMutation } from '@tanstack/react-query';
import { login, resendLoginCode, verifyLoginCode } from '@/core/auth/auth.api';
import type { LoginDto } from '@/core/auth/auth.dto';
import { applySession } from '@/core/auth/session.api';

/**
 * The password step. Usually it answers that a code was emailed; when the backend has the second
 * step turned off it answers the session, which is started right away.
 */
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginDto) => login(credentials),
    onSuccess: (result) => {
      if (result.kind === 'session') applySession(result.session);
    },
  });
}

/** The code step: the right code starts the session. */
export function useVerifyLoginCode() {
  return useMutation({
    mutationFn: ({ code, rememberDevice }: { code: string; rememberDevice: boolean }) =>
      verifyLoginCode(code, rememberDevice),
    onSuccess: (session) => applySession(session),
  });
}

/** Emails a new code for the pending login. */
export function useResendLoginCode() {
  return useMutation({ mutationFn: resendLoginCode });
}

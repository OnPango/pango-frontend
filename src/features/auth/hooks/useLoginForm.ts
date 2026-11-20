import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorCode } from '@/core/api/errors';
import type { LoginChallenge } from '@/core/auth/auth.types';
import type { LoginRedirectState } from '@/core/auth/guards';
import { useLogin } from '../api/useLogin';
import { useResendVerification } from '../api/useVerifyEmail';
import { getAuthErrorMessage } from '../lib/auth.errors';
import { loginSchema, type LoginValues } from '../types/login.schema';

/**
 * State and rules of the login form for one organization: validation, the request, where to go
 * afterwards and the follow-ups the API can ask for (the emailed code, confirm the email, pick
 * another space). The component only renders what this returns.
 */
export function useLoginForm(tenant: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const resend = useResendVerification();
  // Set when the password was right and a code was emailed: the card turns into the code step.
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  // Why the code step ended and the password is asked for again.
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: searchParams.get('email') ?? '', password: '' },
  });

  const redirectTo = (location.state as LoginRedirectState | null)?.from ?? '/';
  const errorCode = getApiErrorCode(login.error);

  const enter = () => navigate(redirectTo, { replace: true });

  const submit = form.handleSubmit((values) => {
    resend.reset();
    setNotice(null);
    login.mutate(values, {
      onSuccess: (result) => (result.kind === 'session' ? enter() : setChallenge(result.challenge)),
    });
  });

  /** Back to the password: the pending login is dropped (it simply expires on the server). */
  const leaveCodeStep = (message: string | null = null) => {
    setChallenge(null);
    setNotice(message);
    login.reset();
    form.resetField('password');
  };

  return {
    form,
    submit,
    /** The second step, while a code is pending. */
    codeStep: challenge && {
      challenge,
      onChallengeChange: setChallenge,
      onVerified: enter,
      onEnd: leaveCodeStep,
      onBack: () => leaveCodeStep(),
    },
    notice,
    isSubmitting: login.isPending,
    serverError: login.isError
      ? getAuthErrorMessage(login.error, 'No se pudo iniciar sesión.')
      : null,
    /** The account exists but its email was never confirmed: offer to send the link again. */
    needsEmailConfirmation: errorCode === 'EMAIL_NOT_VERIFIED',
    /** The address does not belong to any organization: offer to search for another one. */
    workspaceNotFound: errorCode === 'ORGANIZATION_NOT_FOUND',
    /** Arrived from the confirmation link. */
    justVerified: searchParams.get('verified') === '1',
    resend: {
      send: () => resend.mutate({ email: form.getValues('email'), subdomain: tenant }),
      isPending: resend.isPending,
      isSuccess: resend.isSuccess,
      isError: resend.isError,
    },
  };
}

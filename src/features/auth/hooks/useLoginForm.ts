import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiErrorCode } from '@/core/api';
import type { LoginRedirectState } from '@/core/auth/guards';
import { useLogin } from '../api/useLogin';
import { useResendVerification } from '../api/useVerifyEmail';
import { getAuthErrorMessage } from '../lib/auth.errors';
import { loginSchema, type LoginValues } from '../types/login.schema';

/**
 * State and rules of the login form for one organization: validation, the request, where to go
 * afterwards and the two follow-ups the API can ask for (confirm the email, pick another space).
 * The component only renders what this returns.
 */
export function useLoginForm(tenant: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const resend = useResendVerification();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: searchParams.get('email') ?? '', password: '' },
  });

  const redirectTo = (location.state as LoginRedirectState | null)?.from ?? '/';
  const errorCode = getApiErrorCode(login.error);

  const submit = form.handleSubmit((values) => {
    resend.reset();
    login.mutate(values, { onSuccess: () => navigate(redirectTo, { replace: true }) });
  });

  return {
    form,
    submit,
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

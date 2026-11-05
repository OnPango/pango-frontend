import { redirectToTenant } from '@/core/tenant/tenant';
import type { SignupResult } from '@/core/auth/auth.types';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { useResendVerification } from '../api/useVerifyEmail';

/** Seconds before the confirmation email can be requested again. */
const RESEND_COOLDOWN_SECONDS = 60;

/** What the person can do once the sign-up is done: go log in on the new space, or resend the email. */
export function useRegisterSuccess(result: SignupResult | null) {
  const resend = useResendVerification();
  const [resendCooldown, startResendCooldown] = useCountdown(RESEND_COOLDOWN_SECONDS);

  const goToLogin = () => {
    if (!result) return;
    redirectToTenant(result.subdomain, `/login?email=${encodeURIComponent(result.email)}`);
  };

  const resendEmail = () => {
    if (!result) return;
    resend.mutate(
      { email: result.email, subdomain: result.subdomain },
      { onSuccess: startResendCooldown },
    );
  };

  return {
    goToLogin,
    resendEmail,
    isResending: resend.isPending,
    resendFailed: resend.isError,
    resendCooldown,
  };
}

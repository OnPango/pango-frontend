import { useEffect, useState, type RefObject } from 'react';
import { getApiErrorCode } from '@/core/api/errors';
import type { LoginChallenge } from '@/core/auth/auth.types';
import { secondsUntil, useNow } from '@/shared/hooks/useNow';
import type { CodeInputHandle } from '@/shared/ui/components/form/CodeInput';
import { useResendLoginCode, useVerifyLoginCode } from '../api/useLogin';
import { ENDS_LOGIN_CHALLENGE, getAuthErrorMessage, getAuthErrorNumber } from '../lib/auth.errors';

export interface LoginCodeOptions {
  challenge: LoginChallenge;
  /** A new code was sent: its expiry and cooldown replace the previous ones. */
  onChallengeChange: (challenge: LoginChallenge) => void;
  /** The session is open. */
  onVerified: () => void;
  /** The pending login is gone (too many wrong codes, too many sends…): back to the password. */
  onEnd: (message: string) => void;
}

const emptyCode = (length: number) => Array.from({ length }, () => '');

function attemptsMessage(attemptsLeft: number | null): string {
  if (attemptsLeft === null) return 'Ese no es el código. Revísalo e inténtalo de nuevo.';
  return attemptsLeft === 1
    ? 'Ese no es el código. Te queda 1 intento.'
    : `Ese no es el código. Te quedan ${attemptsLeft} intentos.`;
}

/**
 * State and rules of the code step: the digits, sending them once complete, asking for another
 * code after the cooldown, and what to say while the code is pending, wrong or expired.
 */
export function useLoginCode(
  { challenge, onChallengeChange, onVerified, onEnd }: LoginCodeOptions,
  /** The boxes, focused on arrival and after a rejected code. */
  input: RefObject<CodeInputHandle | null>,
) {
  const verify = useVerifyLoginCode();
  const resend = useResendLoginCode();
  const [digits, setDigits] = useState(() => emptyCode(challenge.codeLength));
  const [rejections, setRejections] = useState(0);
  const now = useNow();

  const expiresIn = secondsUntil(challenge.expiresAt, now);
  const resendIn = secondsUntil(challenge.resendAvailableAt, now);
  const expired = expiresIn === 0;
  const complete = digits.every(Boolean);

  useEffect(() => input.current?.focus(), [input]);

  const startOver = () => {
    setDigits(emptyCode(challenge.codeLength));
    requestAnimationFrame(() => input.current?.focus());
  };

  const submit = (code = digits.join('')) => {
    if (verify.isPending || code.length < challenge.codeLength) return;
    resend.reset();
    verify.mutate(code, {
      onSuccess: onVerified,
      onError: (error) => {
        const errorCode = getApiErrorCode(error);
        if (errorCode && ENDS_LOGIN_CHALLENGE.has(errorCode)) {
          onEnd(getAuthErrorMessage(error, 'Inicia sesión de nuevo.'));
          return;
        }
        setRejections((count) => count + 1);
        startOver();
      },
    });
  };

  const sendAnother = () => {
    verify.reset();
    resend.mutate(undefined, {
      onSuccess: (next) => {
        onChallengeChange(next);
        startOver();
      },
      onError: (error) => {
        const errorCode = getApiErrorCode(error);
        if (errorCode && ENDS_LOGIN_CHALLENGE.has(errorCode)) {
          onEnd(getAuthErrorMessage(error, 'Inicia sesión de nuevo.'));
          return;
        }
        const retryAfter = getAuthErrorNumber(error, 'retryAfterSeconds');
        if (retryAfter !== null) {
          onChallengeChange({
            ...challenge,
            resendAvailableAt: new Date(Date.now() + retryAfter * 1000).toISOString(),
          });
        }
      },
    });
  };

  const verifyError = verify.isError
    ? getApiErrorCode(verify.error) === 'LOGIN_CODE_INVALID'
      ? attemptsMessage(getAuthErrorNumber(verify.error, 'attemptsLeft'))
      : getAuthErrorMessage(verify.error, 'No se pudo comprobar el código. Intenta de nuevo.')
    : null;
  const resendError =
    resend.isError && getApiErrorCode(resend.error) !== 'LOGIN_CODE_RESEND_TOO_SOON'
      ? getAuthErrorMessage(resend.error, 'No se pudo enviar otro código. Intenta de nuevo.')
      : null;

  return {
    digits,
    setDigits,
    submit,
    isVerifying: verify.isPending,
    /** Increases on every rejected code, to shake the boxes. */
    rejections,
    /** Red boxes until the person starts typing the next attempt; the message stays. */
    showRejected: (verifyError ?? resendError) !== null && digits.every((digit) => !digit),
    canSubmit: complete && !expired,
    /** The code was rejected or failed to send: say why. */
    error: verifyError ?? resendError,
    /** Neither rejected nor failed: how long the code lasts, or that it already expired. */
    expired,
    expiresIn,
    resend: {
      send: sendAnother,
      isPending: resend.isPending,
      /** A new code was emailed: the resend answered and its email actually went out. */
      sent: resend.isSuccess && challenge.emailSent,
      /** Seconds until another code can be asked for. */
      availableIn: resendIn,
    },
  };
}

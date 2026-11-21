import { useState } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LoginCodeRequiredDto } from '@/core/auth/auth.dto';
import type { LoginChallenge } from '@/core/auth/auth.types';
import { renderWithProviders } from '@/test/render';
import { stubApi } from '@/test/http';
import { LoginCodeStep } from './LoginCodeStep';

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

/** A pending login whose resend is already available. */
const challenge: LoginChallenge = {
  email: 'a**@acme.co',
  codeLength: 6,
  expiresAt: inMinutes(10),
  resendAvailableAt: inMinutes(-1),
  emailSent: true,
};

const resendAnswer = (emailSent: boolean): LoginCodeRequiredDto => ({
  codeRequired: true,
  email: 'a**@acme.co',
  codeLength: 6,
  expiresAt: inMinutes(10),
  resendAvailableAt: inMinutes(1),
  emailSent,
});

/** The login page keeps the challenge; the step replaces it after a resend. */
function Harness() {
  const [current, setCurrent] = useState(challenge);
  return (
    <LoginCodeStep
      challenge={current}
      onChallengeChange={setCurrent}
      onVerified={vi.fn()}
      onEnd={vi.fn()}
      onBack={vi.fn()}
    />
  );
}

describe('LoginCodeStep — resending the code', () => {
  it('announces the new code when its email went out', async () => {
    const requests = stubApi({
      'POST /auth/login/resend': { status: 202, data: resendAnswer(true) },
    });
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: /pide otro código/i }));

    expect(await screen.findByText(/Te enviamos un código nuevo/)).toBeInTheDocument();
    expect(screen.queryByText(/No pudimos enviar el correo/)).not.toBeInTheDocument();
    expect(requests).toHaveLength(1);
  });

  it('does not announce a new code when the API answers that the email failed', async () => {
    stubApi({ 'POST /auth/login/resend': { status: 202, data: resendAnswer(false) } });
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole('button', { name: /pide otro código/i }));

    expect(
      await screen.findByText(/No pudimos enviar el correo con el código/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Te enviamos un código nuevo/)).not.toBeInTheDocument();
  });
});

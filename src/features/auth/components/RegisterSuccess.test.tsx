import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SignupResult } from '@/core/auth/auth.types';
import { stubApi } from '@/test/http';
import { renderWithProviders } from '@/test/render';
import { useRegisterSuccess } from '../hooks/useRegisterSuccess';
import { RegisterSuccess } from './RegisterSuccess';

/** The register page's last step: the success screen wired to its real resend hook. */
function Harness({ result }: { result: SignupResult }) {
  const { goToLogin, resendEmail, isResending, resent, resendFailed, resendCooldown } =
    useRegisterSuccess(result);
  return (
    <RegisterSuccess
      result={result}
      onContinue={goToLogin}
      onResend={resendEmail}
      isResending={isResending}
      resendCooldown={resendCooldown}
      resent={resent}
      resendFailed={resendFailed}
    />
  );
}

const pending = (emailSent: boolean): SignupResult => ({
  kind: 'verification',
  email: 'ana@acme.co',
  subdomain: 'acme',
  emailSent,
});

const COULD_NOT_SEND = /No pudimos enviar el correo de confirmación/;
const RESENT = /te enviamos un nuevo enlace/;

describe('RegisterSuccess', () => {
  it('says the confirmation email was sent when it was', () => {
    renderWithProviders(<Harness result={pending(true)} />);

    expect(screen.getByText(/Enviamos un correo a/)).toBeInTheDocument();
    expect(screen.queryByText(COULD_NOT_SEND)).not.toBeInTheDocument();
  });

  it('does not claim the email was sent when it failed, and offers to resend it', () => {
    renderWithProviders(<Harness result={pending(false)} />);

    expect(screen.queryByText(/Enviamos un correo/)).not.toBeInTheDocument();
    expect(screen.getByText(/Confirma tu correo/)).toBeInTheDocument();
    expect(screen.getByText(COULD_NOT_SEND)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reenviar correo/ })).toBeEnabled();
  });

  it('drops the failure warning once a resend is accepted, without promising delivery', async () => {
    const requests = stubApi({ 'POST /auth/verify-email/resend': { status: 202 } });
    const { user } = renderWithProviders(<Harness result={pending(false)} />);

    await user.click(screen.getByRole('button', { name: /Reenviar correo/ }));

    expect(await screen.findByText(RESENT)).toBeInTheDocument();
    expect(screen.getByText(RESENT)).toHaveTextContent(/^Si tu cuenta sigue pendiente/);
    expect(screen.queryByText(COULD_NOT_SEND)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reenviar correo \(\d+ s\)/ })).toBeDisabled();
    expect(requests).toEqual([
      expect.objectContaining({
        body: { email: 'ana@acme.co' },
        headers: expect.objectContaining({ 'X-Tenant': 'acme' }),
      }),
    ]);
  });

  it('keeps the warning and reports the error when the resend fails', async () => {
    stubApi({ 'POST /auth/verify-email/resend': { status: 500 } });
    const { user } = renderWithProviders(<Harness result={pending(false)} />);

    await user.click(screen.getByRole('button', { name: /Reenviar correo/ }));

    expect(await screen.findByText(/No se pudo reenviar el correo/)).toBeInTheDocument();
    expect(screen.getByText(COULD_NOT_SEND)).toBeInTheDocument();
    expect(screen.queryByText(RESENT)).not.toBeInTheDocument();
  });

  it('tells a ready organization to log in, with no email to confirm', () => {
    renderWithProviders(
      <Harness result={{ kind: 'ready', email: 'ana@acme.co', subdomain: 'acme' }} />,
    );

    expect(screen.getByText(/está listo/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reenviar correo/ })).not.toBeInTheDocument();
  });
});

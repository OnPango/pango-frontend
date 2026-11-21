import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SignupResult } from '@/core/auth/auth.types';
import { renderWithProviders } from '@/test/render';
import { RegisterSuccess } from './RegisterSuccess';

const renderSuccess = (result: SignupResult) =>
  renderWithProviders(
    <RegisterSuccess
      result={result}
      onContinue={vi.fn()}
      onResend={vi.fn()}
      isResending={false}
      resendCooldown={0}
      resendFailed={false}
    />,
  );

const pending = (emailSent: boolean): SignupResult => ({
  kind: 'verification',
  email: 'ana@acme.co',
  subdomain: 'acme',
  emailSent,
});

const COULD_NOT_SEND = /No pudimos enviar el correo de confirmación/;

describe('RegisterSuccess', () => {
  it('says the confirmation email was sent when it was', () => {
    renderSuccess(pending(true));

    expect(screen.getByText(/Enviamos un correo a/)).toBeInTheDocument();
    expect(screen.queryByText(COULD_NOT_SEND)).not.toBeInTheDocument();
  });

  it('does not claim the email was sent when it failed, and offers to resend it', () => {
    renderSuccess(pending(false));

    expect(screen.queryByText(/Enviamos un correo/)).not.toBeInTheDocument();
    expect(screen.getByText(/Confirma tu correo/)).toBeInTheDocument();
    expect(screen.getByText(COULD_NOT_SEND)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reenviar correo/ })).toBeEnabled();
  });

  it('tells a ready organization to log in, with no email to confirm', () => {
    renderSuccess({ kind: 'ready', email: 'ana@acme.co', subdomain: 'acme' });

    expect(screen.getByText(/está listo/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Reenviar correo/ })).not.toBeInTheDocument();
  });
});

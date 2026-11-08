import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCurrentTenant } from '@/core/tenant/tenant';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useEmailVerification, useResendVerification } from '../api/useVerifyEmail';
import { AuthCard, AuthPageShell } from '../components/AuthPageShell';
import { getAuthErrorMessage } from '../lib/auth.errors';

/** Landing page of the confirmation email link: `/verify-email?token=…`. */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const verification = useEmailVerification(token);
  const resend = useResendVerification();
  const [email, setEmail] = useState('');

  const handleResend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resend.mutate({ email, subdomain: getCurrentTenant() ?? undefined });
  };

  return (
    <AuthPageShell>
      <AuthCard
        eyebrow="CONFIRMA TU CORREO"
        title={<h2>{verification.isSuccess ? 'Correo confirmado' : 'Tu correo de trabajo'}</h2>}
      >
        {verification.isLoading && (
          <p role="status" className="flex items-center gap-3 text-muted">
            <Spinner /> Confirmando tu correo…
          </p>
        )}

        {verification.isSuccess && (
          <div className="space-y-5">
            <p className="text-muted">
              Listo, <b className="text-fg">{verification.data.email}</b> quedó confirmado. Ya
              puedes iniciar sesión.
            </p>
            <Link
              to={`/login?verified=1&email=${encodeURIComponent(verification.data.email)}`}
              className="block"
            >
              <Button size="lg" className="w-full" tabIndex={-1}>
                Iniciar sesión
              </Button>
            </Link>
          </div>
        )}

        {(verification.isError || token === '') && (
          <div className="space-y-5">
            <Alert tone="danger">
              {token === ''
                ? 'Este enlace no es válido. Pide uno nuevo.'
                : getAuthErrorMessage(verification.error, 'No se pudo confirmar tu correo.')}
            </Alert>
            {resend.isSuccess ? (
              <Alert tone="success">
                Si ese correo tiene una cuenta pendiente, te enviamos un nuevo enlace.
              </Alert>
            ) : (
              <form onSubmit={handleResend} className="space-y-4">
                <TextBox
                  label="Tu correo de trabajo"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@empresa.co"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Button type="submit" size="lg" className="w-full" isLoading={resend.isPending}>
                  Enviarme un nuevo enlace
                </Button>
                {resend.isError && (
                  <Alert tone="danger">
                    {getAuthErrorMessage(resend.error, 'No se pudo enviar el correo.')}
                  </Alert>
                )}
              </form>
            )}
          </div>
        )}
      </AuthCard>
    </AuthPageShell>
  );
}
